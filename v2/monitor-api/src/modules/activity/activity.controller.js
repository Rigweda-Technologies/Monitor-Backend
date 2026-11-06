import { activityBatchValidation } from "./activity.validation.js";

export const createActivityController = ({ activityService }) => ({
  recordEvents: async (request, reply) => {
    const { error, value } = activityBatchValidation.validate(request.body ?? {}, { abortEarly: false, stripUnknown: true });
    if (error) return reply.code(400).send({
      success: false,
      message: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      errors: error.details.map((item) => ({ field: item.path.join("."), message: item.message })),
    });
    const events = value.events.map((event) => ({
      eventId: event.eventId,
      deviceId: event.deviceId,
      observedAt: event.observedAt,
      status: event.status,
      activeSeconds: event.activeSeconds,
      idleSeconds: event.idleSeconds,
    }));
    const result = await activityService.recordEvents({ auth: request.auth, events });
    return reply.code(202).send({ success: true, data: result });
  },
});
