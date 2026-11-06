import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createScreenshotsService } from "../src/modules/screenshots/screenshots.service.js";

const item = { clientScreenshotId: "client-shot-1", capturedAt: "2026-10-27T10:00:00.000Z", originalFileName: "screen.png", mimeType: "image/png", sha256: "a".repeat(64), sizeBytes: 1024 };

test("screenshot service defers a batch without tenant Cloudinary settings or persistence", async () => {
  let persisted = false;
  const service = createScreenshotsService({ repository: { createUploadBatch: async () => { persisted = true; } }, cloudinaryService: { resolveSettings: async () => null } });
  const result = await service.createUploadSession({ auth: { employeeId: "emp", organizationId: "org" }, batchId: "batch", deviceId: "device", screenshots: [item] });
  assert.equal(result.deferred, true);
  assert.deepEqual(result.uploads, []);
  assert.equal(persisted, false);
});

test("screenshot batch signs uploads after durable metadata creation and emits duplicate descriptors", async () => {
  const calls = [];
  const service = createScreenshotsService({
    repository: { createUploadBatch: async (input) => { calls.push("persist"); return { rows: input.rows.map((row) => ({ ...row, duplicate: row.clientScreenshotId === "duplicate" ? { id: "source-row", cloudinaryUrl: "https://cloudinary.test/image" } : null })) }; } },
    cloudinaryService: { resolveSettings: async () => ({ uploadFolderRoot: "root", screenshotsEnabled: true }), createSignedUploadPayload: async ({ publicId }) => { calls.push(`sign:${publicId}`); return { uploadUrl: "https://upload.test", params: { signature: "safe" } }; } },
  });
  const result = await service.createUploadSession({ auth: { employeeId: "emp", organizationId: "org" }, batchId: "batch", deviceId: "device", screenshots: [item, { ...item, clientScreenshotId: "duplicate" }] });
  assert.equal(calls[0], "persist");
  assert.equal(calls.length, 2);
  assert.equal(result.uploads[0].status, "upload");
  assert.equal(result.uploads[1].duplicateOf, "source-row");
  assert.equal(result.uploads[0].params.signature, "safe");
});

test("direct screenshot flow persists provider metadata and content hash", async () => {
  let saved;
  const buffer = Buffer.from("fake image");
  const service = createScreenshotsService({
    repository: { createDirectScreenshot: async (row) => { saved = row; return row; } },
    cloudinaryService: { resolveSettings: async () => ({ uploadFolderRoot: "root", screenshotsEnabled: true }), uploadBuffer: async () => ({ public_id: "folder/id", secure_url: "https://image.test", asset_id: "asset", version: 7, format: "png" }) },
  });
  const result = await service.createDirectScreenshot({ auth: { employeeId: "emp", organizationId: "org" }, capturedAt: "2026-10-27T10:00:00.000Z", file: { filename: "screen.png", mimetype: "image/png", buffer } });
  assert.equal(saved.sha256, createHash("sha256").update(buffer).digest("hex"));
  assert.equal(saved.cloudinaryAssetId, "asset");
  assert.equal(saved.cloudinaryVersion, null);
  assert.equal(saved.cloudinaryFormat, null);
  assert.deepEqual(Object.keys(result), [
    "id", "batch_id", "organization_id", "employee_id", "device_id", "client_screenshot_id", "captured_at",
    "original_file_name", "mime_type", "width", "height", "sha256", "size_bytes", "cloudinary_folder",
    "cloudinary_public_id", "cloudinary_asset_id", "cloudinary_version", "cloudinary_format", "cloudinary_url",
    "duplicate_of", "upload_status", "processing_status", "error_message", "created_at", "uploaded_at",
  ]);
  assert.equal(result.cloudinary_url, "https://image.test");
  assert.equal(result.original_file_name, "screenshot");
  assert.equal(result.mime_type, "application/octet-stream");
});

test("screenshot completion returns a PostgreSQL-shaped batch row and keeps provider fields out of authority", async () => {
  let received;
  const service = createScreenshotsService({
    repository: { completeUploadBatch: async (input) => { received = input; return { id: "batch", organizationId: "org", employeeId: "employee", deviceId: "device", expectedCount: 1, uploadedCount: 1, duplicateCount: 0, expectedBytes: 10n, uploadedBytes: 10n, firstCapturedAt: new Date("2026-10-27T10:00:00Z"), lastCapturedAt: new Date("2026-10-27T10:00:00Z"), createdAt: new Date("2026-10-27T10:00:00Z"), completedAt: new Date("2026-10-27T10:00:01Z"), status: "complete" }; } },
    cloudinaryService: { resolveSettings: async () => ({}), verifyScreenshotAsset: async () => ({}) },
  });
  const result = await service.completeUploadSession({ auth: { employeeId: "employee", organizationId: "org" }, batchId: "batch", deviceId: "device", uploaded: [{ clientScreenshotId: "client", cloudinaryPublicId: "claim", cloudinaryUrl: "https://claim.test" }], duplicates: [] });
  assert.deepEqual(Object.keys(result).sort(), ["acknowledgedScreenshotIds", "completed_at", "created_at", "device_id", "duplicate_count", "employee_id", "expected_bytes", "expected_count", "first_captured_at", "id", "last_captured_at", "organization_id", "status", "uploaded_bytes", "uploaded_count"].sort());
  assert.equal(result.expected_bytes, "10");
  assert.deepEqual(received.uploaded[0], { clientScreenshotId: "client", cloudinaryPublicId: "claim", cloudinaryUrl: "https://claim.test" });
});

test("completion acknowledges only submitted screenshot IDs after repository completion", async () => {
  let verified;
  const service = createScreenshotsService({
    repository: { completeUploadBatch: async (input) => { verified = input; return { status: "partial" }; } },
    cloudinaryService: { resolveSettings: async () => ({}), verifyScreenshotAsset: async ({ row }) => { assert.equal(row.cloudinary_public_id, "server-public-id"); return {}; } },
  });
  const result = await service.completeUploadSession({ auth: { employeeId: "emp", organizationId: "org" }, batchId: "batch", deviceId: "device", uploaded: [{ clientScreenshotId: "a", cloudinaryPublicId: "untrusted" }], duplicates: [] });
  assert.equal(result.acknowledgedScreenshotIds[0], "a");
  assert.equal(verified.batchId, "batch");
});
