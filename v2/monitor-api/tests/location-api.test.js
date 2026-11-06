import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { createAuthenticateRequest } from "../src/plugins/authentication.js";
import { DeviceOwnershipConflictError } from "../src/errors.js";

const payload = {
  device_id: "device-1",
  timestamp: "2026-10-27T10:00:00.000Z",
  latitude: 17.385,
  longitude: 78.4867,
  source: "windows_native",
  metadata: { city: "Hyderabad", region: "Telangana" },
};

const makeApp = async ({ verifySession, assertDeviceOwner } = {}) => buildApp({
  logger: false,
  authenticateRequest: createAuthenticateRequest({ verifySession: verifySession || (async () => ({ userId: "user-1", employeeId: "employee-1", organizationId: "org-1" })) }),
  activityService: { recordEvents: async () => ({ inserted: 0, saved: 0, duplicateCount: 0 }) },
  browserHistoryService: { recordEntries: async () => ({ inserted: 0, duplicateCount: 0 }) },
  appUsageService: { recordSessions: async () => ({ received: 0, employeeId: "employee-1", organizationId: "org-1" }) },
  locationService: { receiveReport: assertDeviceOwner || (async ({ report }) => ({
    success: true,
    message: "Location report received",
    data: { device_id: report.device_id, receivedAt: "2026-10-27T10:00:01.000Z", source: report.source },
  })) },
  cloudinaryService: { getPublicUploadConfig: async () => ({ cloudName: "test", apiKey: "test", uploadFolderRoot: "test", screenshotsEnabled: true, mouseEnabled: true, keyboardEnabled: true, updatedAt: new Date().toISOString() }) },
  screenshotsService: { createUploadSession: async () => ({}), completeUploadSession: async () => ({}), createDirectScreenshot: async () => ({}) },
});

test("POST /api/v2/agents/location authenticates and acknowledges without persisting coordinates", async (t) => {
  let received;
  const app = await makeApp({ assertDeviceOwner: async (input) => {
    received = input;
    return { success: true, message: "Location report received", data: { device_id: input.report.device_id, receivedAt: "2026-10-27T10:00:01.000Z", source: input.report.source } };
  } });
  t.after(() => app.close());
  const response = await app.inject({ method: "POST", url: "/api/v2/agents/location", headers: { authorization: "Bearer token" }, payload });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    success: true,
    message: "Location report received",
    data: { device_id: "device-1", receivedAt: "2026-10-27T10:00:01.000Z", source: "windows_native" },
  });
  assert.equal(received.auth.organizationId, "org-1");
  assert.equal(received.report.device_id, "device-1");
  assert.equal(JSON.stringify(response.json()).includes("17.385"), false);
});

test("location success echoes the original device_id value like V1", async (t) => {
  const app = await makeApp({ assertDeviceOwner: async ({ report }) => ({ success: true, message: "Location report received", data: { device_id: report.device_id, receivedAt: "2026-10-27T10:00:01.000Z", source: report.source } }) });
  t.after(() => app.close());
  const response = await app.inject({ method: "POST", url: "/api/v2/agents/location", headers: { authorization: "Bearer token" }, payload: { ...payload, device_id: " device-1 " } });
  assert.equal(response.json().data.device_id, " device-1 ");
});

test("location accepts non-empty whitespace device_id strings as the V1 schema does", async (t) => {
  const app = await makeApp({ assertDeviceOwner: async () => ({ success: true, message: "Location report received", data: { device_id: " ", receivedAt: "2026-10-27T10:00:01.000Z", source: "failed" } }) });
  t.after(() => app.close());
  const response = await app.inject({ method: "POST", url: "/api/v2/agents/location", headers: { authorization: "Bearer token" }, payload: { ...payload, device_id: " " } });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.device_id, " ");
});

test("location route rejects invalid coordinates, source and extra fields", async (t) => {
  const app = await makeApp();
  t.after(() => app.close());
  for (const invalid of [
    { ...payload, latitude: 91 },
    { ...payload, longitude: -181 },
    { ...payload, source: "gps" },
    { ...payload, metadata: { city: 3 } },
  ]) {
    const response = await app.inject({ method: "POST", url: "/api/v2/agents/location", headers: { authorization: "Bearer token" }, payload: invalid });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().errorCode, "VALIDATION_ERROR");
  }
  const extra = await app.inject({ method: "POST", url: "/api/v2/agents/location", headers: { authorization: "Bearer token" }, payload: { ...payload, extra: "ignored" } });
  assert.equal(extra.statusCode, 200);
});

test("location route requires verified authentication and rejects known foreign device ownership", async (t) => {
  const app = await makeApp({ assertDeviceOwner: async () => { throw new DeviceOwnershipConflictError(); } });
  t.after(() => app.close());
  const unauthenticated = await app.inject({ method: "POST", url: "/api/v2/agents/location", payload });
  assert.equal(unauthenticated.statusCode, 401);
  assert.deepEqual(unauthenticated.json(), { success: false, message: "Sign in to continue." });
  const conflict = await app.inject({ method: "POST", url: "/api/v2/agents/location", headers: { authorization: "Bearer token" }, payload });
  assert.equal(conflict.statusCode, 409);
});
