import { appUsageBatchValidation } from "./app-usage.validation.js";

export const createAppUsageController = ({ appUsageService }) => ({
  recordSessions: async (request, reply) => {
    const { error, value } = appUsageBatchValidation.validate(request.body ?? {}, { abortEarly: false, stripUnknown: true });
    if (error) return reply.code(400).send({
      success: false,
      message: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      errors: error.details.map((item) => ({ field: item.path.join(".") || "body", message: item.message, type: item.type })),
    });
    const events = value.events.map((event) => ({
      sessionId: event.sessionId,
      deviceId: event.deviceId,
      observedAt: event.observedAt,
      appName: event.appName,
      processName: event.processName,
      startedAt: event.startedAt,
      endedAt: event.endedAt,
      activeSeconds: event.activeSeconds,
      keyPressCount: event.keyPressCount,
      keyNames: event.keyNames,
      typedText: event.typedText,
      keyStreamText: event.keyStreamText,
    }));
    const result = await appUsageService.recordSessions({ auth: request.auth, events });
    return reply.code(202).send({ success: true, data: result });
  },
});
