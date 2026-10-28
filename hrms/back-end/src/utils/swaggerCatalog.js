const DEFAULT_V2_OPENAPI_SOURCE_URL = "http://127.0.0.1:3002/docs/json";
const FALLBACK_V2_OPENAPI_DOCUMENT = require("../openapi/monitor-v2.json");

const createSwaggerCatalogOptions = ({
  v2OpenApiUrl = "/openapi/v2.json",
} = {}) => ({
  explorer: true,
  swaggerUrls: [
    { name: "HRMS API V1", url: "/openapi/v1.json" },
    { name: "Monitor API V2", url: v2OpenApiUrl },
  ],
  swaggerOptions: {
    "urls.primaryName": "HRMS API V1",
  },
});

const createV2OpenApiProxyHandler = ({
  sourceUrl = process.env.V2_OPENAPI_SOURCE_URL || DEFAULT_V2_OPENAPI_SOURCE_URL,
  fetchImpl = globalThis.fetch,
  fallbackDocument = FALLBACK_V2_OPENAPI_DOCUMENT,
  timeoutMs = 3000,
} = {}) => async (_request, response) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetchImpl(sourceUrl, { signal: controller.signal });
    if (!upstream.ok) {
      return response.json(fallbackDocument);
    }

    const document = await upstream.json();
    return response.json(document);
  } catch {
    return response.json(fallbackDocument);
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { createSwaggerCatalogOptions, createV2OpenApiProxyHandler };
