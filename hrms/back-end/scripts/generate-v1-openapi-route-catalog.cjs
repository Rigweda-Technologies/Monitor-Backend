const fs = require("node:fs");
const path = require("node:path");
const { API_V1_PREFIX, API_V1_ROUTES } = require("../src/routes/apiV1");
const swaggerSpec = require("../swagger");

const publicOperations = new Set([
  "post /users/login",
  "post /users/login/selfie",
  "post /users/send-otp",
  "post /users/verify-otp",
  "post /users/forgot-password/send-otp",
  "post /users/forgot-password/verify-otp",
  "post /users/forgot-password/reset-password",
]);

const collectRouterOperations = (router, mountPath, operations) => {
  for (const layer of router.stack || []) {
    if (layer.route) {
      const routePaths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      const methods = Object.keys(layer.route.methods || {}).filter((method) => !method.startsWith("_"));
      for (const routePath of routePaths) {
        const joinedPath = `${mountPath}${routePath === "/" ? "" : routePath}`;
        for (const method of methods) operations.add(`${method.toLowerCase()} ${joinedPath}`);
      }
      continue;
    }

    if (layer.name === "router") {
      const nestedMount = layer.slash ? "" : (layer.path || "");
      collectRouterOperations(layer.handle, `${mountPath}${nestedMount}`, operations);
    }
  }
};

const normalizeOperation = (operation) => {
  const [method, ...pathParts] = operation.split(" ");
  const routePath = pathParts.join(" ")
    .replace(/^\/api\/v1/, "")
    .replace(/:([^/]+)/g, "{$1}") || "/";
  return { method, path: routePath };
};

const toTag = (routePath) => {
  const firstSegment = routePath.split("/").filter(Boolean)[0] || "Operations";
  const labels = {
    agents: "Agents",
    "approval-flows": "Approval Flows",
    "leave-balances": "Leave Balances",
    "leave-types": "Leave Types",
    "org-settings": "Organization Settings",
    "organization-documents": "Organization Documents",
    "week-offs": "Week Offs",
  };
  return labels[firstSegment] || firstSegment.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
};

const createOperation = ({ method, path: routePath }) => {
  const parameters = [...routePath.matchAll(/\{([^}]+)\}/g)].map(([, name]) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
  const operation = {
    tags: [toTag(routePath)],
    summary: `${method.toUpperCase()} ${routePath}`,
    description: "Registered V1 route. Request and response fields follow the existing V1 validator and controller; detailed schemas are not declared in this catalog entry.",
    responses: {
      default: { description: "Response follows the existing V1 route implementation." },
    },
  };
  if (parameters.length) operation.parameters = parameters;

  if (publicOperations.has(`${method} ${routePath}`)) {
    operation.security = [];
  } else {
    operation.security = [{ BearerAuth: [] }];
  }
  return operation;
};

const main = () => {
  const routesDirectory = path.resolve(__dirname, "../src/routes");
  const mountedOperations = new Set();
  for (const [mountPath, modulePath] of API_V1_ROUTES) {
    const router = require(path.resolve(routesDirectory, modulePath));
    collectRouterOperations(router, `${API_V1_PREFIX}${mountPath}`, mountedOperations);
  }
  mountedOperations.add("post /api/v1/notifications/device-token/register");
  mountedOperations.add("post /api/v1/notifications/device-token/unregister");

  const outputPath = path.resolve(__dirname, "../src/openapi/v1-route-catalog.json");
  const previousCatalog = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, "utf8")) : {};
  for (const [routePath, methods] of Object.entries(previousCatalog)) {
    for (const method of Object.keys(methods)) {
      delete swaggerSpec.paths[routePath]?.[method];
    }
    if (swaggerSpec.paths[routePath] && Object.keys(swaggerSpec.paths[routePath]).length === 0) {
      delete swaggerSpec.paths[routePath];
    }
  }

  const catalog = {};
  for (const rawOperation of [...mountedOperations].sort()) {
    const { method, path: routePath } = normalizeOperation(rawOperation);
    const existing = swaggerSpec.paths[routePath]?.[method];
    if (existing) continue;
    catalog[routePath] ||= {};
    catalog[routePath][method] = createOperation({ method, path: routePath });
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
  const operationCount = Object.values(catalog).reduce((count, methods) => count + Object.keys(methods).length, 0);
  console.log(`Generated ${operationCount} missing V1 Swagger operations across ${Object.keys(catalog).length} paths.`);
};

if (require.main === module) main();
