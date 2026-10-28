import { createAppUsageController } from "./app-usage.controller.js";

const errorEnvelope = {
  type: "object",
  required: ["success", "message", "errorCode"],
  properties: {
    success: { type: "boolean", const: false },
    message: { type: "string" },
    errorCode: { type: "string" },
    errors: { type: "array", items: { type: "object", properties: { field: { type: "string" }, message: { type: "string" }, type: { type: "string" } } } },
  },
};
const authenticationError = { type: "object", required: ["success", "message"], properties: { success: { type: "boolean" }, message: { type: "string" } } };

const appUsageEventSchema = {
  type: "object",
  required: ["sessionId", "deviceId", "observedAt", "appName", "processName", "startedAt", "endedAt"],
  properties: {
    sessionId: { type: "string", minLength: 1, maxLength: 120 },
    deviceId: { type: "string", minLength: 1, maxLength: 120 },
    observedAt: { type: "string", format: "date-time" },
    appName: { type: "string", minLength: 1, maxLength: 255 },
    processName: { type: "string", minLength: 1, maxLength: 255 },
    startedAt: { type: "string", format: "date-time" },
    endedAt: { type: "string", format: "date-time" },
    activeSeconds: { type: "integer", minimum: 0, maximum: 86400, default: 0 },
    keyPressCount: { type: "integer", minimum: 0, maximum: 1000000, default: 0 },
    keyNames: { type: "array", items: { type: "string", maxLength: 100 }, default: [] },
    typedText: { type: "string", maxLength: 100000, default: "" },
    keyStreamText: { type: "string", maxLength: 100000, default: "" },
  },
};

export const registerAppUsageRoutes = async (fastify, { appUsageService, authenticateRequest }) => {
  const controller = createAppUsageController({ appUsageService });
  fastify.post("/app-usage/batch", {
    preHandler: authenticateRequest,
    attachValidation: true,
    schema: {
      tags: ["App Usage"],
      summary: "Store local app usage sessions",
      description: "Stores authenticated app usage events. Typed text and key streams are never included in logs or responses.",
      security: [{ bearerAuth: [] }],
      body: { type: "object", required: ["events"], properties: { events: { type: "array", minItems: 1, maxItems: 100, items: appUsageEventSchema } } },
      response: {
        202: {
          type: "object",
          required: ["success", "data"],
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              required: ["received", "employeeId", "organizationId"],
              properties: { received: { type: "integer" }, employeeId: { type: "string" }, organizationId: { type: "string" } },
            },
          },
        },
        400: errorEnvelope,
        401: authenticationError,
        409: errorEnvelope,
        503: errorEnvelope,
      },
    },
  }, controller.recordSessions);
};
