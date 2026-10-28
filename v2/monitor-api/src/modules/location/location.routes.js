import { createLocationController } from "./location.controller.js";

const responseSchema = {
  type: "object",
  required: ["success", "message", "data"],
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data: {
      type: "object",
      required: ["device_id", "receivedAt", "source"],
      properties: {
        device_id: { type: "string" },
        receivedAt: { type: "string", format: "date-time" },
        source: { type: "string", enum: ["windows_native", "ip_fallback", "failed"] },
      },
    },
  },
};

const errorSchema = {
  type: "object",
  required: ["success", "message", "errorCode"],
  properties: {
    success: { type: "boolean", const: false },
    message: { type: "string" },
    errorCode: { type: "string" },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: { field: { type: "string" }, message: { type: "string" }, keyword: { type: "string" } },
      },
    },
  },
};
const authenticationErrorSchema = { type: "object", required: ["success", "message"], properties: { success: { type: "boolean" }, message: { type: "string" } } };

const locationBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["device_id", "timestamp", "latitude", "longitude", "source"],
  properties: {
    device_id: { type: "string", minLength: 1 },
    timestamp: { type: "string", format: "date-time" },
    latitude: { type: "number", minimum: -90, maximum: 90 },
    longitude: { type: "number", minimum: -180, maximum: 180 },
    source: { type: "string", enum: ["windows_native", "ip_fallback", "failed"] },
    metadata: {
      type: "object",
      additionalProperties: false,
      properties: { city: { type: ["string", "null"] }, region: { type: ["string", "null"] } },
    },
  },
};

const validateMetadata = async (request, reply) => {
  const metadata = request.body?.metadata;
  if (metadata === undefined) return;
  if (metadata === null || Array.isArray(metadata) || typeof metadata !== "object") {
    return reply.code(400).send({
      success: false,
      message: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      errors: [{ field: "metadata", message: "must be object", keyword: "type" }],
    });
  }
  for (const field of ["city", "region"]) {
    const value = metadata[field];
    if (value !== undefined && value !== null && typeof value !== "string") {
      return reply.code(400).send({
        success: false,
        message: "Validation failed",
        errorCode: "VALIDATION_ERROR",
        errors: [{ field: `metadata.${field}`, message: "must be string or null", keyword: "type" }],
      });
    }
  }
};

export const registerLocationRoutes = async (fastify, { locationService, authenticateRequest }) => {
  const controller = createLocationController({ locationService });
  fastify.post("/agents/location", {
    preHandler: authenticateRequest,
    preValidation: validateMetadata,
    schema: {
      tags: ["Agents"],
      summary: "Receive an authenticated desktop agent location report",
      description: "Acknowledges the report without persisting or logging coordinates or location metadata.",
      security: [{ bearerAuth: [] }],
      body: locationBodySchema,
      response: { 200: responseSchema, 400: errorSchema, 401: authenticationErrorSchema, 409: errorSchema, 503: errorSchema },
    },
  }, controller.receiveReport);
};
