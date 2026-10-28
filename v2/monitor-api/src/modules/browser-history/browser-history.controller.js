export const createBrowserHistoryController = ({ browserHistoryService }) => ({
  recordEntries: async (request, reply) => {
    const body = request.body ?? {};
    const entries = Array.isArray(body.entries) ? body.entries : [];
    const deviceId = String(body.deviceId || "").trim();
    const invalid = (message) => reply.code(400).send({ success: false, message, errorCode: "VALIDATION_ERROR" });
    if (!deviceId) return invalid("deviceId is required.");
    if (!entries.length) return invalid("At least one browser history entry is required.");
    if (entries.length > 200) return invalid("Send at most 200 browser history entries per request.");
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") return invalid("Each browser history entry must be an object.");
      if (!String(entry.observedAt || "").trim()) return invalid("Each browser history entry must include observedAt.");
      if (!String(entry.browser || "").trim()) return invalid("Each browser history entry must include browser.");
      if (!String(entry.url || "").trim()) return invalid("Each browser history entry must include url.");
    }
    const normalizedEntries = entries.map((entry) => ({
      observedAt: entry.observedAt,
      browser: entry.browser,
      url: entry.url,
      title: entry.title,
      activeWindowTitle: entry.activeWindowTitle,
      durationMs: entry.durationMs,
    }));
    const result = await browserHistoryService.recordEntries({
      auth: request.auth,
      deviceId,
      entries: normalizedEntries,
    });
    return reply.code(202).send({ success: true, data: result });
  },
});
