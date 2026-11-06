import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildApp } from "../src/app.js";
import { createAuthenticateRequest } from "../src/plugins/authentication.js";
import { DeviceOwnershipConflictError } from "../src/errors.js";

const event = {
  eventId: "event-1",
  deviceId: "device-1",
  observedAt: "2026-10-27T10:00:00.000Z",
  status: "active",
  activeSeconds: 30,
};

const makeApp = async ({ verifySession, recordEvents } = {}) => {
  const app = await buildApp({
    logger: false,
    apiBaseUrl: "http://localhost:3002",
    authenticateRequest: createAuthenticateRequest({
      verifySession: verifySession || (async () => ({
        userId: "user-1",
        organizationId: "org-1",
        employeeId: "employee-1",
        employeeName: "Test User",
        activityTimeZone: "Asia/Kolkata",
      })),
    }),
    activityService: {
      recordEvents: recordEvents || (async () => ({ inserted: 1, saved: 1, duplicateCount: 0 })),
    },
    browserHistoryService: { recordEntries: async () => ({ inserted: 0, duplicateCount: 0 }) },
    appUsageService: { recordSessions: async () => ({ received: 0, employeeId: "test", organizationId: "test" }) },
    locationService: { receiveReport: async () => ({ success: true, message: "ok", data: {} }) },
    cloudinaryService: { getPublicUploadConfig: async () => ({ cloudName: "test", apiKey: "test", uploadFolderRoot: "test", screenshotsEnabled: true, mouseEnabled: true, keyboardEnabled: true, updatedAt: new Date().toISOString() }) },
  screenshotsService: { createUploadSession: async () => ({}), completeUploadSession: async () => ({}), createDirectScreenshot: async () => ({}) },
  });
  return app;
};

test("POST /api/v2/activity-events/batch records a validated event and ignores caller ownership fields", async (t) => {
  let recorded;
  const app = await makeApp({
    recordEvents: async (input) => {
      recorded = input;
      return { inserted: 1, saved: 1, duplicateCount: 0 };
    },
  });
  t.after(() => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/api/v2/activity-events/batch",
    headers: { authorization: "Bearer session-token" },
    payload: {
      organizationId: "attacker-org",
      employeeId: "attacker-employee",
      events: [{ ...event, organizationId: "attacker-org", employeeId: "attacker-employee" }],
    },
  });

  assert.equal(response.statusCode, 202);
  assert.deepEqual(response.json(), {
    success: true,
    data: { inserted: 1, saved: 1, duplicateCount: 0 },
  });
  assert.equal(recorded.auth.organizationId, "org-1");
  assert.equal(recorded.auth.employeeId, "employee-1");
  assert.equal(recorded.events[0].organizationId, undefined);
  assert.equal(recorded.events[0].employeeId, undefined);
});

test("activity route rejects empty, oversized and malformed batches", async (t) => {
  const app = await makeApp();
  t.after(() => app.close());

  for (const events of [[], Array.from({ length: 101 }, (_, index) => ({ ...event, eventId: `event-${index}` })), [{ ...event, status: "unknown" }]]) {
    const response = await app.inject({
      method: "POST",
      url: "/api/v2/activity-events/batch",
      headers: { authorization: "Bearer session-token" },
      payload: { events },
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().errorCode, "VALIDATION_ERROR");
    assert.equal(Object.hasOwn(response.json(), "requestId"), false);
    assert.equal(Object.hasOwn(response.json(), "keyword"), false);
  }
});

test("activity route rejects requests without a bearer token", async (t) => {
  const app = await makeApp();
  t.after(() => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/api/v2/activity-events/batch",
    payload: { events: [event] },
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), { success: false, message: "Sign in to continue." });
  assert.equal(Object.hasOwn(response.json(), "requestId"), false);
});

test("activity route returns a safe 409 when device ownership conflicts", async (t) => {
  const app = await makeApp({
    recordEvents: async () => { throw new DeviceOwnershipConflictError(); },
  });
  t.after(() => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/api/v2/activity-events/batch",
    headers: { authorization: "Bearer session-token" },
    payload: { events: [event] },
  });

  assert.equal(response.statusCode, 409);
  assert.equal(response.json().errorCode, "DEVICE_OWNERSHIP_CONFLICT");
  assert.equal(Object.hasOwn(response.json(), "requestId"), false);
});

test("OpenAPI documents every v2 endpoint, including operational routes", async (t) => {
  const app = await makeApp();
  t.after(() => app.close());

  const response = await app.inject({ method: "GET", url: "/docs/json" });
  assert.equal(response.statusCode, 200);
  const { paths } = response.json();
  for (const [path, method] of [
    ["/", "get"],
    ["/api/v2/health", "get"],
    ["/api/v2/ready", "get"],
    ["/api/v2/activity-events/batch", "post"],
    ["/api/v2/browser-history/batch", "post"],
    ["/api/v2/app-usage/batch", "post"],
    ["/api/v2/agents/location", "post"],
    ["/api/v2/cloudinary/upload-config", "get"],
    ["/api/v2/screenshots", "post"],
    ["/api/v2/screenshot-batches/uploads", "post"],
    ["/api/v2/screenshot-batches/{batchId}/complete", "post"],
  ]) {
    assert.ok(paths[path]?.[method], `Missing OpenAPI operation ${method.toUpperCase()} ${path}`);
  }
  const fallbackSpec = JSON.parse(await readFile(new URL("../../../hrms/back-end/src/openapi/monitor-v2.json", import.meta.url), "utf8"));
  assert.deepEqual(paths, fallbackSpec.paths, "Regenerate the combined Swagger fallback after changing V2 routes.");
});
