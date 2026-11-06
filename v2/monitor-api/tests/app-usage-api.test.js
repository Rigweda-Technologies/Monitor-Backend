import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { createAuthenticateRequest } from "../src/plugins/authentication.js";

const sample = {
  sessionId: "session-1", deviceId: "device-1", observedAt: "2026-10-27T10:00:00.000Z",
  appName: "Editor", processName: "editor.exe", startedAt: "2026-10-27T09:59:00.000Z", endedAt: "2026-10-27T10:00:00.000Z",
};

const makeApp = async ({ recordSessions } = {}) => buildApp({
  logger: false,
  authenticateRequest: createAuthenticateRequest({ verifySession: async () => ({ userId: "user-1", employeeId: "employee-1", organizationId: "org-1" }) }),
  activityService: { recordEvents: async () => ({ inserted: 0, saved: 0, duplicateCount: 0 }) },
  browserHistoryService: { recordEntries: async () => ({ inserted: 0, duplicateCount: 0 }) },
  appUsageService: { recordSessions: recordSessions || (async () => ({ received: 1, employeeId: "employee-1", organizationId: "org-1" })) },
  locationService: { receiveReport: async () => ({ success: true, message: "ok", data: {} }) },
  cloudinaryService: { getPublicUploadConfig: async () => ({ cloudName: "test", apiKey: "test", uploadFolderRoot: "test", screenshotsEnabled: true, mouseEnabled: true, keyboardEnabled: true, updatedAt: new Date().toISOString() }) },
  screenshotsService: { createUploadSession: async () => ({}), completeUploadSession: async () => ({}), createDirectScreenshot: async () => ({}) },
});

test("POST /api/v2/app-usage/batch accepts bounded events and returns V1-compatible identity counts", async (t) => {
  let saved;
  const app = await makeApp({ recordSessions: async (input) => { saved = input; return { received: 1, employeeId: "employee-1", organizationId: "org-1" }; } });
  t.after(() => app.close());
  const response = await app.inject({
    method: "POST", url: "/api/v2/app-usage/batch", headers: { authorization: "Bearer token" },
    payload: { organizationId: "caller-org", events: [{ ...sample, typedText: "secret typing", organizationId: "caller-org" }] },
  });
  assert.equal(response.statusCode, 202);
  assert.deepEqual(response.json(), { success: true, data: { received: 1, employeeId: "employee-1", organizationId: "org-1" } });
  assert.equal(saved.auth.organizationId, "org-1");
  assert.equal(saved.events[0].typedText, "secret typing");
  assert.equal(saved.events[0].organizationId, undefined);
});

test("app usage route rejects missing, oversized and malformed batches", async (t) => {
  const app = await makeApp();
  t.after(() => app.close());
  for (const events of [[], Array.from({ length: 101 }, () => sample), [{ ...sample, keyPressCount: -1 }], [{ ...sample, typedText: "x".repeat(100_001) }]]) {
    const response = await app.inject({ method: "POST", url: "/api/v2/app-usage/batch", headers: { authorization: "Bearer token" }, payload: { events } });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().errorCode, "VALIDATION_ERROR");
    assert.ok(Array.isArray(response.json().errors));
    assert.equal(typeof response.json().errors[0].type, "string");
    assert.equal(Object.hasOwn(response.json(), "requestId"), false);
    assert.equal(response.json().errorCode, "VALIDATION_ERROR");
  }
});

test("app usage requires a verified HRMS session", async (t) => {
  const app = await makeApp();
  t.after(() => app.close());
  const response = await app.inject({ method: "POST", url: "/api/v2/app-usage/batch", payload: { events: [sample] } });
  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), { success: false, message: "Sign in to continue." });
});
