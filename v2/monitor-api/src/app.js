import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import { HttpError } from "./errors.js";
import { registerActivityRoutes } from "./modules/activity/activity.routes.js";
import { registerBrowserHistoryRoutes } from "./modules/browser-history/browser-history.routes.js";
import { registerAppUsageRoutes } from "./modules/app-usage/app-usage.routes.js";
import { registerLocationRoutes } from "./modules/location/location.routes.js";
import { registerCloudinaryRoutes } from "./modules/cloudinary/cloudinary.routes.js";
import { registerScreenshotsRoutes } from "./modules/screenshots/screenshots.routes.js";

export const buildApp = async ({
  authenticateRequest,
  activityService,
  browserHistoryService,
  appUsageService,
  locationService,
  cloudinaryService,
  screenshotsService,
  isReady = async () => true,
  logger = true,
  apiBaseUrl = "http://localhost:3002",
  corsOrigins = [],
} = {}) => {
  if (typeof authenticateRequest !== "function") throw new TypeError("authenticateRequest is required.");
  if (typeof activityService?.recordEvents !== "function") throw new TypeError("activityService.recordEvents is required.");
  if (typeof browserHistoryService?.recordEntries !== "function") throw new TypeError("browserHistoryService.recordEntries is required.");
  if (typeof appUsageService?.recordSessions !== "function") throw new TypeError("appUsageService.recordSessions is required.");
  if (typeof locationService?.receiveReport !== "function") throw new TypeError("locationService.receiveReport is required.");
  if (typeof cloudinaryService?.getPublicUploadConfig !== "function") throw new TypeError("cloudinaryService.getPublicUploadConfig is required.");
  if (typeof screenshotsService?.createUploadSession !== "function") throw new TypeError("screenshotsService.createUploadSession is required.");

  const fastify = Fastify({
    logger: logger === false ? false : {
      level: "info",
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
  });

  await fastify.register(cors, {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, corsOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  });
  await fastify.register(multipart, {
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Rigweda Monitor API V2",
        description: "Version 2 monitor ingestion APIs",
        version: "2.0.0",
      },
      servers: [{ url: apiBaseUrl }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: false },
  });

  fastify.get("/", {
    schema: {
      tags: ["Operations"],
      summary: "Get V2 service information",
      response: {
        200: {
          type: "object",
          required: ["message", "docs", "health"],
          properties: {
            message: { type: "string" },
            docs: { type: "string" },
            health: { type: "string" },
          },
        },
      },
    },
  }, async () => ({ message: "Rigweda Monitor API V2 is running", docs: "/docs", health: "/api/v2/health" }));
  fastify.get("/api/v2/health", {
    schema: {
      tags: ["Operations"],
      summary: "Check whether the V2 process is running",
      response: { 200: { type: "object", required: ["status"], properties: { status: { type: "string", const: "healthy" } } } },
    },
  }, async () => ({ status: "healthy" }));
  fastify.get("/api/v2/ready", {
    schema: {
      tags: ["Operations"],
      summary: "Check whether the V2 service can accept work",
      response: {
        200: { type: "object", required: ["status"], properties: { status: { type: "string", const: "ready" } } },
        503: { type: "object", required: ["status"], properties: { status: { type: "string", const: "not_ready" } } },
      },
    },
  }, async (_request, reply) => {
    try {
      await isReady();
      return { status: "ready" };
    } catch {
      return reply.code(503).send({ status: "not_ready" });
    }
  });

  fastify.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({
        success: false,
        message: "Validation failed",
        errorCode: "VALIDATION_ERROR",
        errors: error.validation.map((item) => ({
          field: item.instancePath ? item.instancePath.replace(/^\//, "").replaceAll("/", ".") : "body",
          message: item.message || "Invalid value",
          keyword: item.keyword,
        })),
      });
    }

    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({
        success: false,
        message: error.message,
        errorCode: error.code,
      });
    }

    request.log.error({ name: error.name, code: error.code, requestId: request.id }, "Request failed.");
    return reply.code(500).send({
      success: false,
      message: "Internal server error.",
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  });

  await fastify.register(registerActivityRoutes, {
    prefix: "/api/v2",
    authenticateRequest,
    activityService,
  });
  await fastify.register(registerBrowserHistoryRoutes, {
    prefix: "/api/v2",
    browserHistoryService,
    authenticateRequest,
  });
  await fastify.register(registerAppUsageRoutes, { prefix: "/api/v2", appUsageService, authenticateRequest });
  await fastify.register(registerLocationRoutes, { prefix: "/api/v2", locationService, authenticateRequest });
  await fastify.register(registerCloudinaryRoutes, { prefix: "/api/v2", cloudinaryService, authenticateRequest });
  await fastify.register(registerScreenshotsRoutes, { prefix: "/api/v2", screenshotsService, authenticateRequest });

  return fastify;
};
