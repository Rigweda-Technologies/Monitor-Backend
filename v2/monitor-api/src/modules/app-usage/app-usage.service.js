import { HttpError, MissingOrganizationIdentityError } from "../../errors.js";

const toDate = (value, field) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, "VALIDATION_ERROR", `${field} must be a valid timestamp.`);
  return date;
};

export const createAppUsageService = ({ repository }) => ({
  async recordSessions({ auth, events }) {
    const organizationId = String(auth.organizationId || "").trim();
    const employeeId = String(auth.employeeId || auth.userId || "").trim();
    if (!organizationId || !employeeId) throw new MissingOrganizationIdentityError();

    const normalizedEvents = events.map((event) => ({
      sessionId: event.sessionId.trim(),
      deviceId: event.deviceId.trim(),
      observedAt: toDate(event.observedAt, "observedAt"),
      appName: event.appName.trim(),
      processName: event.processName.trim(),
      startedAt: toDate(event.startedAt, "startedAt"),
      endedAt: toDate(event.endedAt, "endedAt"),
      activeSeconds: event.activeSeconds ?? 0,
      keyPressCount: event.keyPressCount ?? 0,
      keyNames: Array.isArray(event.keyNames) ? event.keyNames.map((keyName) => String(keyName).trim()) : [],
      typedText: event.typedText ?? "",
      keyStreamText: event.keyStreamText ?? "",
    }));

    return repository.saveSessions({
      organizationId,
      employeeId,
      employeeName: auth.employeeName || null,
      events: normalizedEvents,
    });
  },
});
