const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const swaggerSpec = require("../swagger");
const { API_V1_PREFIX, API_V1_ROUTES } = require("../src/routes/apiV1");

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
  const routePath = pathParts.join(" ").replace(/^\/api\/v1/, "").replace(/:([^/]+)/g, "{$1}") || "/";
  return `${method} ${routePath}`;
};

test("Swagger V1 documents every mounted API method and path", () => {
  const routesDirectory = path.resolve(__dirname, "../src/routes");
  const mountedOperations = new Set();
  for (const [mountPath, modulePath] of API_V1_ROUTES) {
    const router = require(path.resolve(routesDirectory, modulePath));
    collectRouterOperations(router, `${API_V1_PREFIX}${mountPath}`, mountedOperations);
  }
  mountedOperations.add("post /api/v1/notifications/device-token/register");
  mountedOperations.add("post /api/v1/notifications/device-token/unregister");

  const documentedOperations = new Set(
    Object.entries(swaggerSpec.paths).flatMap(([routePath, methods]) =>
      Object.keys(methods).map((method) => `${method.toLowerCase()} ${routePath}`)),
  );
  const expectedOperations = new Set([...mountedOperations].map(normalizeOperation));
  const missingOperations = [...expectedOperations].filter((operation) => !documentedOperations.has(operation));
  const unregisteredOperations = [...documentedOperations].filter((operation) => !expectedOperations.has(operation));

  assert.deepEqual(missingOperations, [], `Missing Swagger operations: ${missingOperations.join(", ")}`);
  assert.deepEqual(unregisteredOperations, [], `Swagger contains unregistered operations: ${unregisteredOperations.join(", ")}`);

  for (const operation of documentedOperations) {
    const separator = operation.indexOf(" ");
    const method = operation.slice(0, separator);
    const routePath = operation.slice(separator + 1);
    const details = swaggerSpec.paths[routePath][method];
    assert.ok(details.summary, `Missing summary for ${operation}`);
    assert.ok(details.tags?.length, `Missing tag for ${operation}`);
    assert.ok(Object.keys(details.responses || {}).length, `Missing responses for ${operation}`);
    for (const [, parameterName] of routePath.matchAll(/\{([^}]+)\}/g)) {
      assert.ok(details.parameters?.some((parameter) => parameter.in === "path" && parameter.name === parameterName && parameter.required), `Missing required path parameter ${parameterName} for ${operation}`);
    }
  }
});
