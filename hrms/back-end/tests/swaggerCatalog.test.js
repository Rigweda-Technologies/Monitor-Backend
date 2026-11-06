const test = require("node:test");
const assert = require("node:assert/strict");
const { createSwaggerCatalogOptions, createV2OpenApiProxyHandler } = require("../src/utils/swaggerCatalog.js");

test("Swagger catalog offers HRMS V1 and Monitor V2 documents", () => {
  const options = createSwaggerCatalogOptions();
  assert.deepEqual(options.swaggerUrls, [
    { name: "HRMS API V1", url: "/openapi/v1.json" },
    { name: "Monitor API V2", url: "/openapi/v2.json" },
  ]);
  assert.equal(options.swaggerOptions["urls.primaryName"], "HRMS API V1");
});

test("V2 OpenAPI proxy forwards the generated document", async () => {
  const expected = { openapi: "3.0.3", paths: { "/api/v2/activity-events/batch": { post: {} } } };
  let statusCode = 200;
  let body;
  const response = {
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; },
  };
  const handler = createV2OpenApiProxyHandler({
    sourceUrl: "http://127.0.0.1:3002/docs/json",
    fetchImpl: async () => ({ ok: true, json: async () => expected }),
  });

  await handler({}, response);
  assert.equal(statusCode, 200);
  assert.deepEqual(body, expected);
});

test("V2 OpenAPI proxy serves its generated document when the API service is offline", async () => {
  let statusCode = 200;
  let body;
  const fallbackDocument = { openapi: "3.0.3", paths: { "/api/v2/health": { get: {} } } };
  const response = {
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; },
  };
  const handler = createV2OpenApiProxyHandler({
    fallbackDocument,
    fetchImpl: async () => { throw new Error("connection details are private"); },
  });

  await handler({}, response);
  assert.equal(statusCode, 200);
  assert.deepEqual(body, fallbackDocument);
});
