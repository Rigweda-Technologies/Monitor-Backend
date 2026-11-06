const DEFAULT_ACTIVITY_TIMEZONE = "Asia/Kolkata";

const isValidTimeZone = (timeZone) => {
  try {
    if (!timeZone || typeof timeZone !== "string") return false;
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

export const toDateKeyInTimeZone = (dateValue, timeZone = DEFAULT_ACTIVITY_TIMEZONE) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) throw new TypeError("observedAt must be a valid date.");
  const safeTimeZone = isValidTimeZone(timeZone) ? timeZone : DEFAULT_ACTIVITY_TIMEZONE;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value;
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
};

export const buildDailyKey = ({ organizationId, employeeId, activityDate }) =>
  `${organizationId}:${employeeId}:${activityDate}`;

export const createActivityService = ({ repository }) => ({
  async recordEvents({ auth, events }) {
    const organizationId = String(auth.organizationId || "").trim();
    const employeeId = String(auth.employeeId || auth.userId || "").trim();
    if (!organizationId || !employeeId) {
      throw new TypeError("Verified organization and employee identity are required.");
    }

    const normalizedEvents = events.map((event) => ({
      eventId: event.eventId.trim(),
      deviceId: event.deviceId.trim(),
      observedAt: event.observedAt instanceof Date ? event.observedAt : new Date(event.observedAt),
      status: event.status,
      activeSeconds: event.activeSeconds ?? 0,
      idleSeconds: event.idleSeconds ?? 0,
    }));

    return repository.saveEvents({
      organizationId,
      employeeId,
      employeeName: auth.employeeName || null,
      activityTimeZone: auth.activityTimeZone || DEFAULT_ACTIVITY_TIMEZONE,
      events: normalizedEvents,
    });
  },
});
