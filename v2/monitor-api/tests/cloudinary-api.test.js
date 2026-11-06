import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { createAuthenticateRequest } from "../src/plugins/authentication.js";

const makeApp = async ({ getPublicUploadConfig } = {}) => buildApp({
  logger: false,
  authenticateRequest: createAuthenticateRequest({ verifySession: async () => ({ userId: "user-1", employeeId: "employee-1", organizationId: "org-1" }) }),
  activityService: { recordEvents: async () => ({ inserted: 0, saved: 0, duplicateCount: 0 }) },
  browserHistoryService: { recordEntries: async () => ({ inserted: 0, duplicateCount: 0 }) },
  appUsageService: { recordSessions: async () => ({ received: 0, employeeId: "employee-1", organizationId: "org-1" }) },
  locationService: { receiveReport: async () => ({ success: true, message: "ok", data: {} }) },
  cloudinaryService: { getPublicUploadConfig: getPublicUploadConfig || (async () => ({ cloudName: "tenant-cloud", apiKey: "public-key" })) },
  screenshotsService: { createUploadSession: async () => ({}), completeUploadSession: async () => ({}), createDirectScreenshot: async () => ({}) },
});

test("GET /api/v2/cloudinary/upload-config returns tenant public settings only", async (t) => {
  let organizationId;
  const app = await makeApp({ getPublicUploadConfig: async (input) => {
    organizationId = input.organizationId;
    return { cloudName: "tenant-cloud", apiKey: "public-key", uploadFolderRoot: "rigweda-monitor", screenshotsEnabled: true, mouseEnabled: true, keyboardEnabled: false, updatedAt: "2026-10-27T10:00:00.000Z" };
  } });
  t.after(() => app.close());
  const response = await app.inject({ method: "GET", url: "/api/v2/cloudinary/upload-config", headers: { authorization: "Bearer token" } });
  assert.equal(response.statusCode, 200);
  assert.equal(organizationId, "org-1");
  assert.equal(response.json().data.cloudName, "tenant-cloud");
  assert.equal(JSON.stringify(response.json()).includes("apiSecret"), false);
});

test("Cloudinary upload config requires a verified session", async (t) => {
  const app = await makeApp();
  t.after(() => app.close());
  const response = await app.inject({ method: "GET", url: "/api/v2/cloudinary/upload-config" });
  assert.equal(response.statusCode, 401);
});

test("Cloudinary upload config preserves the V1 404 payload when tenant settings are absent", async (t) => {
  const app = await makeApp({ getPublicUploadConfig: async () => null });
  t.after(() => app.close());
  const response = await app.inject({ method: "GET", url: "/api/v2/cloudinary/upload-config", headers: { authorization: "Bearer token" } });
  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), { success: false, message: "Cloudinary settings are not configured yet." });
});
