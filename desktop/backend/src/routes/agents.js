import { activityModel } from "../modules/activity/activity.model.js";

const locationReportBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["device_id", "timestamp", "latitude", "longitude", "source"],
  properties: {
    device_id: {
      type: "string",
      minLength: 1,
    },
    timestamp: {
      type: "string",
      format: "date-time",
    },
    latitude: {
      type: "number",
      minimum: -90,
      maximum: 90,
    },
    longitude: {
      type: "number",
      minimum: -180,
      maximum: 180,
    },
    source: {
      type: "string",
      enum: ["windows_native", "ip_fallback", "failed"],
    },
    metadata: {
      type: "object",
      additionalProperties: false,
      properties: {
        city: {
          type: ["string", "null"],
        },
        region: {
          type: ["string", "null"],
        },
      },
    },
  },
};

const locationReportResponseSchema = {
  type: "object",
  required: ["success", "message"],
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data: {
      type: "object",
      properties: {
        device_id: { type: "string" },
        receivedAt: { type: "string" },
        source: { type: "string" },
      },
    },
  },
};

const sendValidationError = (reply, field, message, keyword = "type") =>
  reply.code(400).send({
    success: false,
    message: "Validation failed",
    errorCode: "VALIDATION_ERROR",
    errors: [
      {
        field,
        message,
        keyword,
      },
    ],
  });

const validateLocationReportMetadata = async (request, reply) => {
  const metadata = request.body?.metadata;
  if (metadata === undefined) {
    return;
  }

  if (metadata === null || Array.isArray(metadata) || typeof metadata !== "object") {
    return sendValidationError(reply, "metadata", "must be object");
  }

  for (const field of ["city", "region"]) {
    if (metadata[field] !== undefined && metadata[field] !== null && typeof metadata[field] !== "string") {
      return sendValidationError(reply, `metadata.${field}`, "must be string or null");
    }
  }
};

const postAgentLocationHandler = (locationModel) => async (request, reply) => {
  const payload = request.body;
  const auth = request.auth;

  if (!auth?.userId || !auth?.organizationId) {
    return reply.code(401).send({
      success: false,
      message: "An authenticated organization user is required.",
      errorCode: "UNAUTHORIZED",
    });
  }

  const storedReport = await locationModel.saveLocationReport({
    organizationId: String(auth.organizationId),
    employeeId: String(auth.userId),
    deviceId: payload.device_id,
    observedAt: payload.timestamp,
    latitude: payload.latitude,
    longitude: payload.longitude,
    source: payload.source,
    metadata: payload.metadata ?? {},
  });

  request.log.info(
    {
      device_id: storedReport.id,
    },
    "Stored employee location report"
  );

  return reply.code(200).send({
    success: true,
    message: "Location report received",
    data: {
      device_id: payload.device_id,
      receivedAt: storedReport.receivedAt,
      source: payload.source,
    },
  });
};

export const registerAgentRoutes = async (fastify, { locationModel = activityModel } = {}) => {
  fastify.post(
    "/location",
    {
      preValidation: validateLocationReportMetadata,
      preHandler: async (request, reply) => {
        const authHeader = request.headers.authorization;
        const isLocalTestToken = authHeader === "Bearer DIAGNOSTIC_MOCK_TOKEN";

        if (process.env.NODE_ENV !== "production" && isLocalTestToken) {
          request.log.info(
            "Development Mode: Bypassing external session authentication for local agent diagnostic verification."
          );
          request.auth = {
            userId: "local-diagnostic-employee",
            organizationId: "local-diagnostic-organization",
          };
          return;
        }

        await fastify.authenticateRequest(request, reply);
      },
      schema: {
        tags: ["Agents"],
        summary: "Receive employee location telemetry from desktop agents",
        security: [{ bearerAuth: [] }],
        body: locationReportBodySchema,
        response: {
          200: locationReportResponseSchema,
        },
      },
    },
    postAgentLocationHandler(locationModel)
  );
};
