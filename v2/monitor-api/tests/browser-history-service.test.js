import test from "node:test";
import assert from "node:assert/strict";
import { HttpError } from "../src/errors.js";
import {
  createBrowserHistoryService,
  normalizeBrowserHistoryEntry,
} from "../src/modules/browser-history/browser-history.service.js";

const baseEntry = {
  observedAt: "2026-10-27 12:34:56",
  browser: " Chrome ",
  url: " https://example.test/path ",
  title: " Page title ",
  activeWindowTitle: " Browser window ",
  durationMs: 125.4,
};

test("browser history normalizes V1 timestamp, text, browser and duration semantics", () => {
  const normalized = normalizeBrowserHistoryEntry(baseEntry, " device-1 ");
  assert.equal(normalized.deviceId, "device-1");
  assert.equal(normalized.browser, "chrome");
  assert.equal(normalized.observedAt.toISOString(), "2026-10-27T12:34:56.000Z");
  assert.equal(normalized.url, "https://example.test/path");
  assert.equal(normalized.durationMs, 125);
});

test("browser history hashes are deterministic after normalization and include entry content", () => {
  const first = normalizeBrowserHistoryEntry(baseEntry, "device-1");
  const normalizedReplay = normalizeBrowserHistoryEntry({ ...baseEntry, browser: "chrome", url: baseEntry.url.trim() }, " device-1 ");
  const changedUrl = normalizeBrowserHistoryEntry({ ...baseEntry, url: "https://example.test/other" }, "device-1");

  assert.equal(first.entryId, normalizedReplay.entryId);
  assert.notEqual(first.entryId, changedUrl.entryId);
  assert.match(first.entryId, /^[a-f0-9]{64}$/);
});

test("browser history clamps duration and rejects invalid required fields or timestamps", () => {
  assert.equal(normalizeBrowserHistoryEntry({ ...baseEntry, durationMs: 100_000_000 }, "device-1").durationMs, 86_400_000);
  assert.equal(normalizeBrowserHistoryEntry({ ...baseEntry, durationMs: -5 }, "device-1").durationMs, 0);
  assert.throws(() => normalizeBrowserHistoryEntry({ ...baseEntry, observedAt: "not-a-date" }, "device-1"),
    (error) => error instanceof HttpError && error.statusCode === 400);
  assert.throws(() => normalizeBrowserHistoryEntry({ ...baseEntry, url: "  " }, "device-1"),
    (error) => error instanceof HttpError && error.statusCode === 400);
});

test("browser history service resolves owner from verified auth and delegates normalized entries", async () => {
  let saved;
  const service = createBrowserHistoryService({
    repository: {
      saveEntries: async (input) => { saved = input; return { inserted: 1, duplicateCount: 0 }; },
    },
  });

  const result = await service.recordEntries({
    auth: { userId: "verified-user", employeeId: "verified-employee", organizationId: "verified-org", employeeName: "Verified Person" },
    deviceId: "device-1",
    entries: [baseEntry],
  });

  assert.deepEqual(result, { inserted: 1, duplicateCount: 0 });
  assert.equal(saved.organizationId, "verified-org");
  assert.equal(saved.employeeId, "verified-employee");
  assert.equal(saved.employeeName, "Verified Person");
  assert.equal(saved.entries[0].deviceId, "device-1");
});

test("browser history service falls back to verified user ID when employee ID is absent", async () => {
  let saved;
  const service = createBrowserHistoryService({ repository: { saveEntries: async (input) => { saved = input; return {}; } } });
  await service.recordEntries({
    auth: { userId: "verified-user", organizationId: "verified-org" },
    deviceId: "device-1",
    entries: [baseEntry],
  });
  assert.equal(saved.employeeId, "verified-user");
});
