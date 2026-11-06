import { createActivityController } from "./activity.controller.js";

const activityEventSchema = {
  type: "object",
  required: ["eventId", "deviceId", "observedAt", "status"],
  properties: {
    eventId: { type: "string", minLength: 1, maxLength: 120 },
    deviceId: { type: "string", minLength: 1, maxLength: 120 },
    observedAt: { type: "string", format: "date-time" },
    status: { type: "string", enum: ["active", "idle", "offline"] },
    activeSeconds: { type: "integer", minimum: 0, maximum: 3600, default: 0 },
    idleSeconds: { type: "integer", minimum: 0, maximum: 3600, default: 0 },
  },
};

const activityBatchSchema = {
  type: "object",
  required: ["events"],
  properties: {
    events: {
      type: "array",
      minItems: 1,
      maxItems: 100,
      items: activityEventSchema,
    },
  },
};

const validationError = {
  type: "object", required: ["success", "message", "errorCode", "errors"],
  properties: { success: { type: "boolean" }, message: { type: "string" }, errorCode: { type: "string" }, errors: { type: "array", items: { type: "object", properties: { field: { type: "string" }, message: { type: "string" } } } } },
};
const authenticationError = { type: "object", required: ["success", "message"], properties: { success: { type: "boolean" }, message: { type: "string" } } };
const serviceError = { type: "object", required: ["success", "message", "errorCode"], properties: { success: { type: "boolean" }, message: { type: "string" }, errorCode: { type: "string" } } };

export const registerActivityRoutes = async (fastify, options) => {
  const { authenticateRequest, activityService } = options;
  const controller = createActivityController({ activityService });

  fastify.post(
    "/activity-events/batch",
    {
      preHandler: authenticateRequest,
      attachValidation: true,
      schema: {
        tags: ["Activity"],
        summary: "Store local mouse activity events",
        security: [{ bearerAuth: [] }],
        body: activityBatchSchema,
        response: {
          400: validationError,
          401: authenticationError,
          409: serviceError,
          202: {
            type: "object",
            required: ["success", "data"],
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                required: ["inserted", "saved", "duplicateCount"],
                properties: {
                  inserted: { type: "integer" },
                  saved: { type: "integer" },
                  duplicateCount: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    controller.recordEvents,
  );
};
