import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { createAuthenticateRequest } from "../src/plugins/authentication.js";
import { DeviceOwnershipConflictError } from "../src/errors.js";

const entry = {
  observedAt: "2026-10-27T10:00:00.000Z",
  browser: "Chrome",
  url: "https://example.test/path",
};

const makeApp = async ({ verifySession, recordEntries } = {}) => buildApp({
  logger: false,
  authenticateRequest: createAuthenticateRequest({
    verifySession: verifySession || (async () => ({ userId: "user-1", organizationId: "org-1", employeeId: "employee-1" })),
  }),
  activityService: { recordEvents: async () => ({ inserted: 0, saved: 0, duplicateCount: 0 }) },
  browserHistoryService: {
    recordEntries: recordEntries || (async () => ({ inserted: 1, duplicateCount: 0 })),
  },
  appUsageService: { recordSessions: async () => ({ received: 0, employeeId: "test", organizationId: "test" }) },
  locationService: { receiveReport: async () => ({ success: true, message: "ok", data: {} }) },
  cloudinaryService: { getPublicUploadConfig: async () => ({ cloudName: "test", apiKey: "test", uploadFolderRoot: "test", screenshotsEnabled: true, mouseEnabled: true, keyboardEnabled: true, updatedAt: new Date().toISOString() }) },
  screenshotsService: { createUploadSession: async () => ({}), completeUploadSession: async () => ({}), createDirectScreenshot: async () => ({}) },
});

test("POST /api/v2/browser-history/batch accepts entries and ignores caller ownership fields", async (t) => {
  let recorded;
  const app = await makeApp({ recordEntries: async (input) => { recorded = input; return { inserted: 1, duplicateCount: 0 }; } });
  t.after(() => app.close());
  const response = await app.inject({
    method: "POST",
    url: "/api/v2/browser-history/batch",
    headers: { authorization: "Bearer session-token" },
    payload: {
      organizationId: "attacker-org",
      employeeId: "attacker-employee",
      deviceId: "device-1",
      entries: [{ ...entry, organizationId: "attacker-org", employeeId: "attacker-employee" }],
    },
  });

  assert.equal(response.statusCode, 202);
  assert.deepEqual(response.json(), { success: true, data: { inserted: 1, duplicateCount: 0 } });
  assert.equal(recorded.auth.organizationId, "org-1");
  assert.equal(recorded.auth.employeeId, "employee-1");
  assert.equal(recorded.entries[0].organizationId, undefined);
});

test("browser history rejects missing, empty, oversized and malformed batches", async (t) => {
  const app = await makeApp();
  t.after(() => app.close());
  for (const payload of [
    {},
    { deviceId: "device-1", entries: [] },
    { deviceId: "device-1", entries: Array.from({ length: 201 }, () => entry) },
    { deviceId: "device-1", entries: [{ ...entry, browser: "" }] },
  ]) {
    const response = await app.inject({
      method: "POST",
      url: "/api/v2/browser-history/batch",
      headers: { authorization: "Bearer session-token" },
      payload,
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().errorCode, "VALIDATION_ERROR");
  }
});

test("browser history controller forwards non-empty timestamps for V1-compatible service validation", async (t) => {
  const app = await makeApp();
  t.after(() => app.close());
  const response = await app.inject({
    method: "POST",
    url: "/api/v2/browser-history/batch",
    headers: { authorization: "Bearer session-token" },
    payload: { deviceId: "device-1", entries: [{ ...entry, observedAt: "not-a-date" }] },
  });
  assert.equal(response.statusCode, 202);
});

test("browser history requires verified session and returns safe owner conflicts", async (t) => {
  const app = await makeApp({ recordEntries: async () => { throw new DeviceOwnershipConflictError(); } });
  t.after(() => app.close());

  const unauthenticated = await app.inject({ method: "POST", url: "/api/v2/browser-history/batch", payload: { deviceId: "device-1", entries: [entry] } });
  assert.equal(unauthenticated.statusCode, 401);
  assert.deepEqual(unauthenticated.json(), { success: false, message: "Sign in to continue." });

  const conflict = await app.inject({
    method: "POST",
    url: "/api/v2/browser-history/batch",
    headers: { authorization: "Bearer session-token" },
    payload: { deviceId: "device-1", entries: [entry] },
  });
  assert.equal(conflict.statusCode, 409);
  assert.equal(conflict.json().errorCode, "DEVICE_OWNERSHIP_CONFLICT");
});
