import { createBrowserHistoryController } from "./browser-history.controller.js";

const responseEnvelope = {
  type: "object",
  required: ["success", "data"],
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      required: ["inserted", "duplicateCount"],
      properties: {
        inserted: { type: "integer", minimum: 0 },
        duplicateCount: { type: "integer", minimum: 0 },
      },
    },
  },
};

const errorEnvelope = {
  type: "object",
  required: ["success", "message", "errorCode"],
  properties: {
    success: { type: "boolean", const: false },
    message: { type: "string" },
    errorCode: { type: "string" },
  },
};
const authenticationError = { type: "object", required: ["success", "message"], properties: { success: { type: "boolean" }, message: { type: "string" } } };

const nonWhitespaceString = { type: "string", minLength: 1, pattern: "\\S" };

const browserHistoryBatchSchema = {
  type: "object",
  required: ["deviceId", "entries"],
  properties: {
    deviceId: nonWhitespaceString,
    entries: {
      type: "array",
      minItems: 1,
      maxItems: 200,
      items: {
        type: "object",
        required: ["observedAt", "browser", "url"],
        properties: {
          observedAt: nonWhitespaceString,
          browser: nonWhitespaceString,
          url: nonWhitespaceString,
          title: { type: "string", nullable: true },
          activeWindowTitle: { type: "string", nullable: true },
          durationMs: { type: "number", nullable: true },
        },
      },
    },
  },
};

export const registerBrowserHistoryRoutes = async (fastify, { browserHistoryService, authenticateRequest }) => {
  const controller = createBrowserHistoryController({ browserHistoryService });
  fastify.post("/browser-history/batch", {
    preHandler: authenticateRequest,
    attachValidation: true,
    schema: {
      tags: ["Browser History"],
      summary: "Store an authenticated browser history batch",
      description: "Stores normalized browser observations without logging or returning URLs or page titles.",
      security: [{ bearerAuth: [] }],
      body: browserHistoryBatchSchema,
      response: {
        202: responseEnvelope,
        400: errorEnvelope,
        401: authenticationError,
        409: errorEnvelope,
        503: errorEnvelope,
      },
    },
  }, controller.recordEntries);
};
