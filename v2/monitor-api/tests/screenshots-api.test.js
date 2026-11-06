import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { createAuthenticateRequest } from "../src/plugins/authentication.js";
import { HttpError } from "../src/errors.js";

const makeApp = async (overrides = {}) => buildApp({
  logger: false,
  authenticateRequest: createAuthenticateRequest({ verifySession: async () => ({ userId: "user-1", employeeId: "employee-1", organizationId: "org-1" }) }),
  activityService: { recordEvents: async () => ({}) },
  browserHistoryService: { recordEntries: async () => ({}) },
  appUsageService: { recordSessions: async () => ({}) },
  locationService: { receiveReport: async () => ({}) },
  cloudinaryService: { getPublicUploadConfig: async () => ({}), resolveSettings: async () => null, createSignedUploadPayload: async () => ({}), verifyScreenshotAsset: async () => ({}) },
  screenshotsService: {
    createUploadSession: async () => ({ batchId: "batch-1", uploads: [] }),
    completeUploadSession: async (input) => ({ status: "complete", acknowledgedScreenshotIds: input.uploaded.map((item) => item.clientScreenshotId) }),
    createDirectScreenshot: async () => ({}),
    ...overrides,
  },
});

test("screenshot batch route validates metadata, binds authenticated identity and documents all operations", async (t) => {
  let received;
  const app = await makeApp({ createUploadSession: async (input) => { received = input; return { batchId: input.batchId, uploads: [] }; } });
  t.after(() => app.close());
  const response = await app.inject({
    method: "POST", url: "/api/v2/screenshot-batches/uploads", headers: { authorization: "Bearer token" },
    payload: { organizationId: "attacker", batchId: "batch-1", deviceId: "device-1", screenshots: [{ clientScreenshotId: "shot-1", capturedAt: "2026-10-27T10:00:00.000Z", originalFileName: "shot.png", mimeType: "image/png", sha256: "a".repeat(64), sizeBytes: 1024 }] },
  });
  assert.equal(response.statusCode, 201);
  assert.equal(received.auth.organizationId, "org-1");
  assert.equal(received.organizationId, undefined);
  const spec = await app.inject({ method: "GET", url: "/docs/json" });
  assert.ok(spec.json().paths["/api/v2/screenshots"]?.post);
  assert.ok(spec.json().paths["/api/v2/screenshot-batches/uploads"]?.post);
  assert.ok(spec.json().paths["/api/v2/screenshot-batches/{batchId}/complete"]?.post);
});

test("screenshot batch rejects malformed metadata and completion IDs repeated across claims", async (t) => {
  const app = await makeApp({ completeUploadSession: async () => { throw new HttpError(400, "VALIDATION_ERROR", "Repeated screenshot IDs."); } });
  t.after(() => app.close());
  const invalid = await app.inject({ method: "POST", url: "/api/v2/screenshot-batches/uploads", headers: { authorization: "Bearer token" }, payload: { batchId: "b", deviceId: "d", screenshots: [{ clientScreenshotId: "s", capturedAt: "bad", originalFileName: "x", mimeType: "image/gif", sha256: "bad", sizeBytes: 0 }] } });
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.json().errorCode, "VALIDATION_ERROR");
  assert.equal(typeof invalid.json().errors[0].type, "string");
  assert.equal(Object.hasOwn(invalid.json(), "requestId"), false);
  const complete = await app.inject({ method: "POST", url: "/api/v2/screenshot-batches/b/complete", headers: { authorization: "Bearer token" }, payload: { deviceId: "d", uploaded: [{ clientScreenshotId: "s", cloudinaryPublicId: "public", cloudinaryUrl: "https://cloudinary.test/image" }], duplicates: [{ clientScreenshotId: "s", duplicateOf: "original" }] } });
  assert.equal(complete.statusCode, 400);
  assert.equal(complete.json().errorCode, "VALIDATION_ERROR");
});

test("screenshot upload endpoint requires authenticated multipart file input", async (t) => {
  let uploadedFile;
  const app = await makeApp({ createDirectScreenshot: async ({ file }) => { uploadedFile = file; return {}; } });
  t.after(() => app.close());
  assert.equal((await app.inject({ method: "POST", url: "/api/v2/screenshots" })).statusCode, 401);
  const badPayload = await app.inject({ method: "POST", url: "/api/v2/screenshots", headers: { authorization: "Bearer token" }, payload: {} });
  assert.equal(badPayload.statusCode, 400);
  assert.deepEqual(badPayload.json(), { success: false, message: "Screenshot file is required" });
  const boundary = "test-boundary";
  const body = [
    `--${boundary}\r\nContent-Disposition: form-data; name="capturedAt"\r\n\r\n2026-10-27T10:00:00.000Z\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="screenshot"; filename="screen.bin"\r\nContent-Type: application/octet-stream\r\n\r\nPNG\r\n`,
    `--${boundary}--\r\n`,
  ].join("");
  const valid = await app.inject({ method: "POST", url: "/api/v2/screenshots", headers: { authorization: "Bearer token", "content-type": `multipart/form-data; boundary=${boundary}` }, payload: body });
  assert.equal(valid.statusCode, 201, valid.body);
  assert.equal(uploadedFile.filename, "screenshot");
  assert.equal(uploadedFile.mimetype, "application/octet-stream");
});
