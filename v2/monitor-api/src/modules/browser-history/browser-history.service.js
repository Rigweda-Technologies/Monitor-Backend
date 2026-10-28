import { createHash } from "node:crypto";
import { MissingOrganizationIdentityError, InvalidBrowserHistoryEntryError } from "../../errors.js";

const normalizeText = (value) => String(value || "").trim();

export const normalizeBrowserHistoryDuration = (value) => {
  const duration = Number(value || 0);
  if (!Number.isFinite(duration) || duration < 0) return 0;
  return Math.min(Math.round(duration), 86_400_000);
};

const hasTimeZoneDesignator = (value) => /([zZ]|[+-]\d{2}:?\d{2})$/.test(String(value || "").trim());
const isExplicitDateTimeString = (value) => /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(?:\.\d{1,6})?)?$/.test(String(value || "").trim());

export const normalizeBrowserHistoryObservedAt = (value) => {
  const raw = String(value || "").trim();
  const timestamp = isExplicitDateTimeString(raw) && !hasTimeZoneDesignator(raw)
    ? new Date(`${raw.replace(" ", "T")}Z`)
    : new Date(raw);
  if (Number.isNaN(timestamp.getTime())) throw new InvalidBrowserHistoryEntryError("Each entry must include a valid observedAt timestamp.");
  return timestamp;
};

export const normalizeBrowserHistoryEntry = (entry, deviceId) => {
  const normalizedDeviceId = normalizeText(deviceId);
  const browser = normalizeText(entry.browser).toLowerCase();
  const observedAt = normalizeBrowserHistoryObservedAt(entry.observedAt);
  const url = normalizeText(entry.url);
  const title = normalizeText(entry.title);
  const activeWindowTitle = normalizeText(entry.activeWindowTitle);
  const durationMs = normalizeBrowserHistoryDuration(entry.durationMs);

  if (!normalizedDeviceId) throw new InvalidBrowserHistoryEntryError("deviceId is required.");
  if (!browser) throw new InvalidBrowserHistoryEntryError("Each entry must include browser.");
  if (!url) throw new InvalidBrowserHistoryEntryError("Each entry must include url.");

  const entryId = createHash("sha256")
    .update([
      normalizedDeviceId,
      browser,
      observedAt.toISOString(),
      url,
      title,
      activeWindowTitle,
      String(durationMs),
    ].join("|"))
    .digest("hex");

  return {
    entryId,
    deviceId: normalizedDeviceId,
    observedAt,
    browser,
    url,
    title,
    activeWindowTitle: activeWindowTitle || null,
    durationMs,
  };
};

export const createBrowserHistoryService = ({ repository }) => ({
  async recordEntries({ auth, entries, deviceId }) {
    const organizationId = normalizeText(auth.organizationId);
    const employeeId = normalizeText(auth.employeeId || auth.userId);
    const resolvedDeviceId = normalizeText(deviceId);
    if (!organizationId || !employeeId) throw new MissingOrganizationIdentityError();
    if (!resolvedDeviceId) throw new InvalidBrowserHistoryEntryError("deviceId is required.");

    const normalizedEntries = entries.map((entry) => normalizeBrowserHistoryEntry(entry, resolvedDeviceId));
    return repository.saveEntries({
      organizationId,
      employeeId,
      employeeName: auth.employeeName || null,
      deviceId: resolvedDeviceId,
      entries: normalizedEntries,
    });
  },
});
