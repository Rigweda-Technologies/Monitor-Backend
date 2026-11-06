const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const { authLimiter } = require("./src/middlewares/rateLimiter");
const { getRedisClient, isRedisEnabled, isRedisReady } = require("./src/config/redis");
const {
  isPayrollDbEnabled,
  isPayrollDbReady,
  connectPayrollDb,
  validatePayrollDbConfig
} = require("./src/config/payrollDb");
const {
  metricsMiddleware,
  metricsHandler,
  getMetricsSnapshot
} = require("./src/observability/httpMetrics");
const { getRequestBodyLimit } = require("./src/config/requestLimits");

// Load the common settings first. `npm run local` and `npm run server` set
// APP_ENV and can override only the values that differ in .env.<mode>.
dotenv.config({ quiet: true });
const appEnv = String(process.env.APP_ENV || "").trim();
if (appEnv) {
  dotenv.config({ path: `.env.${appEnv}`, override: true, quiet: true });
}

// App init
const app = express();

/* -------------------------------------------------------------------------- */
/*                                CONFIG                                      */
/* -------------------------------------------------------------------------- */

const PORT = process.env.PORT || 4000;
const shouldExposeSwagger = process.env.ENABLE_SWAGGER_UI === "true" || process.env.NODE_ENV !== "production";
const shouldExposeMetrics = process.env.ENABLE_HTTP_METRICS === "true" || process.env.NODE_ENV !== "production";

/* -------------------------------------------------------------------------- */
/*                               MIDDLEWARES                                  */
/* -------------------------------------------------------------------------- */

// Release and document uploads are base64 JSON, roughly 33% larger than their source files.
const requestBodyLimit = getRequestBodyLimit();
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));
require("./src/integrations/fcm").mount(app);

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:3002",
  "https://rigweda-hrms-frontend.vercel.app"
];
const configuredAllowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const allowedOrigins = Array.from(
  new Set([
    ...defaultAllowedOrigins.map((origin) => origin.trim().replace(/\/$/, "")),
    ...configuredAllowedOrigins
  ])
);
const server = http.createServer(app);
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const error = Object.assign(
          new Error("CORS policy does not allow this origin: " + origin),
          { statusCode: 403 }
        );
        return callback(error, false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    exposedHeaders: "Content-Type,Authorization,Access-Control-Allow-Credentials",
    credentials: true,
    optionsSuccessStatus: 200
  })
);
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

if (shouldExposeMetrics) {
  app.use(metricsMiddleware);
}

// Custom request logger (audit / tracing)
// const requestLogger = require("./src/middlewares/requestLogger");
// app.use(requestLogger);

if (process.env.ENABLE_RATE_LIMIT !== "false") {
  app.use("/api", authLimiter);
}

/* -------------------------------------------------------------------------- */
/*                               SWAGGER                                      */
/* -------------------------------------------------------------------------- */

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const {
  createSwaggerCatalogOptions,
  createV2OpenApiProxyHandler
} = require("./src/utils/swaggerCatalog");
const { initRealtime } = require("./src/realtime/socket");
const { mountApiV1Routes } = require("./src/routes/apiV1");

if (shouldExposeSwagger) {
  app.get("/openapi/v1.json", (_request, response) => response.json(swaggerSpec));
  app.get("/openapi/v2.json", createV2OpenApiProxyHandler());
  app.use("/swagger-ui", swaggerUi.serve, swaggerUi.setup(null, createSwaggerCatalogOptions()));
}

/* -------------------------------------------------------------------------- */
/*                               ROUTES                                       */
/* -------------------------------------------------------------------------- */

app.get("/", (req, res) => {
  res.json({
    message: "Rigweda HRMS API is running",
    docs: "/swagger-ui",
    health: "/health"
  });
});

// Health check
app.get("/health", (req, res) => {
  const metrics = getMetricsSnapshot();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptimeSeconds: metrics.uptimeSeconds
  });
});

app.get("/ready", async (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const redisEnabled = isRedisEnabled();
  const payrollDbEnabled = isPayrollDbEnabled();

  let redisReady = !redisEnabled || isRedisReady();
  if (redisEnabled && !isRedisReady()) {
    const client = await getRedisClient();
    redisReady = Boolean(client && client.status === "ready");
  }

  const payrollDbReady = payrollDbEnabled ? isPayrollDbReady() : true;
  const isReady = dbReady && redisReady && payrollDbReady;

  return res.status(isReady ? 200 : 503).json({
    status: isReady ? "READY" : "NOT_READY",
    timestamp: new Date().toISOString(),
    checks: {
      database: dbReady ? "up" : "down",
      redis: redisEnabled ? (redisReady ? "up" : "down") : "disabled",
      payrollPostgres: payrollDbEnabled ? (payrollDbReady ? "up" : "down") : "disabled"
    }
  });
});

if (shouldExposeMetrics) {
  app.get("/metrics", metricsHandler);
}

// All existing Express API routes are explicitly versioned as v1.
mountApiV1Routes(app);

const shouldRunSchedulerInApi = process.env.ENABLE_JOB_SCHEDULER === "true";

/* -------------------------------------------------------------------------- */
/*                         GLOBAL ERROR HANDLER                                */
/* -------------------------------------------------------------------------- */

const errorMiddleware = require("./src/middlewares/error.middleware");
app.use(errorMiddleware);

/* -------------------------------------------------------------------------- */
/*                            DATABASE + SERVER                                */
/* -------------------------------------------------------------------------- */

const connectDB = require("./src/config/db");
const Organization = require("./src/modules/organizations/organization.model");
const { seedOrgRolesAndPermissions } = require("./src/modules/roles/role.seeder");
const { ensureSystemBootstrap } = require("./src/utils/bootstrapSystem");

const startServer = async () => {
  await connectDB();
  validatePayrollDbConfig();
  await connectPayrollDb();
  await initRealtime(server, { allowedOrigins });

  try {
    const bootstrapResult = await ensureSystemBootstrap();
    if (bootstrapResult?.created) {
      console.log("🎉 SYSTEM BOOTSTRAPPED SUCCESSFULLY");
      console.log("----------------------------------");
      console.log("SYSTEM ORG ID        :", bootstrapResult.systemOrgId);
      console.log("SuperAdmin Email     :", bootstrapResult.email);
      console.log("SuperAdmin credentials were created; password output is suppressed.");
    }
  } catch (err) {
    console.error("❌ Failed to bootstrap system org:", err);
  }

  try {
    const organizations = await Organization.find({
      code: { $ne: "SYSTEM" }
    }).select("_id");

    for (const org of organizations) {
      await seedOrgRolesAndPermissions(org._id);
    }
    // console.log("✅ Org permissions synced from routes");
  } catch (err) {
    console.error("❌ Failed to sync org permissions from routes:", err);
  }

  if (shouldRunSchedulerInApi) {
    try {
      const { startJobScheduler } = require("./src/jobs/scheduler");
      await startJobScheduler();
    } catch (error) {
      console.error("❌ Failed to start in-process job scheduler:", error?.message || error);
    }
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (shouldExposeSwagger) {
      console.log(`📄 Swagger docs: ${String(process.env.HRMS_BACKEND_URL || "").replace(/\/+$/, "")}/swagger-ui`);
    }
  });
};

startServer();

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION");
  console.error(err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION");
  console.error(reason);
});

module.exports = app;
