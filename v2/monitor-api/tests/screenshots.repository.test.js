import test from "node:test";
import assert from "node:assert/strict";
import { createScreenshotsRepository } from "../src/modules/screenshots/screenshots.repository.js";
import { DeviceOwnershipConflictError, HttpError } from "../src/errors.js";

const row = { id: "row-1", batchId: "batch-1", organizationId: "org-1", employeeId: "employee-1", deviceId: "device-1", clientScreenshotId: "client-1", sha256: "a".repeat(64), cloudinaryPublicId: "server-public-id", cloudinaryFolder: "folder", sizeBytes: 42n, uploadStatus: "pending" };

test("screenshot batch repository persists batch and items transactionally with owner locking", async () => {
  const operations = [];
  const tx = {
    async $queryRaw(query) { operations.push(query.sql); return []; },
    monitorScreenshotBatch: { findUnique: async () => null, create: async ({ data }) => ({ ...data }) },
    monitorScreenshot: {
      findUnique: async () => null, findFirst: async () => null,
      create: async ({ data }) => ({ ...data }), update: async ({ data }) => data,
    },
  };
  const repository = createScreenshotsRepository({ prisma: { $transaction: (work) => work(tx) } });
  const result = await repository.createUploadBatch({ batch: { id: "batch-1", organizationId: "org-1", employeeId: "employee-1", deviceId: "device-1", expectedCount: 1, expectedBytes: 42n }, rows: [row] });
  assert.equal(result.rows[0].id, "row-1");
  assert.ok(operations.some((sql) => sql.includes("pg_advisory_xact_lock")));
});

test("screenshot batch repository rejects foreign device owners before any screenshot insert", async () => {
  let inserted = false;
  const tx = {
    async $queryRaw(query) { return query.sql.includes("SELECT 1 AS conflict") ? [{ conflict: 1 }] : []; },
    monitorScreenshotBatch: { findUnique: async () => null, create: async () => ({}) },
    monitorScreenshot: { findUnique: async () => null, findFirst: async () => null, create: async () => { inserted = true; } },
  };
  const repository = createScreenshotsRepository({ prisma: { $transaction: async (work) => work(tx) } });
  await assert.rejects(repository.createUploadBatch({ batch: { id: "batch-1", organizationId: "org-1", employeeId: "employee-1", deviceId: "device-1" }, rows: [row] }), DeviceOwnershipConflictError);
  assert.equal(inserted, false);
});

test("screenshot completion trusts server metadata, verifies assets, and commits owner scoped counts", async () => {
  const updates = [];
  let verifiedRow;
  const tx = {
    async $queryRaw() { return []; },
    monitorScreenshotBatch: {
      findFirst: async () => ({ id: "batch-1", expectedCount: 1 }),
      update: async ({ data }) => ({ id: "batch-1", ...data }),
    },
    monitorScreenshot: {
      findMany: async () => [row],
      update: async ({ where, data }) => { updates.push({ where, data }); return {}; },
      groupBy: async () => [{ uploadStatus: "uploaded", _count: { _all: 1 }, _sum: { sizeBytes: 100n } }],
      findFirst: async () => null,
    },
  };
  const repository = createScreenshotsRepository({ prisma: { $transaction: (work) => work(tx) } });
  const result = await repository.completeUploadBatch({ organizationId: "org-1", employeeId: "employee-1", batchId: "batch-1", deviceId: "device-1", uploaded: [{ clientScreenshotId: "client-1", cloudinaryUrl: "https://attacker.test" }], duplicates: [], verifyAsset: async (assetRow) => { verifiedRow = assetRow; return { cloudinaryAssetId: "verified-asset", cloudinaryVersion: 4, cloudinaryFormat: "png", cloudinaryUrl: "https://verified.test", sizeBytes: 100 }; } });
  assert.equal(verifiedRow.cloudinaryPublicId, "server-public-id");
  assert.equal(updates[0].data.cloudinaryUrl, "https://verified.test");
  assert.equal(result.status, "complete");
  assert.equal(result.uploadedCount, 1);
});

test("screenshot completion rejects missing owner scoped batches", async () => {
  const tx = { async $queryRaw() { return []; }, monitorScreenshotBatch: { findFirst: async () => null } };
  const repository = createScreenshotsRepository({ prisma: { $transaction: (work) => work(tx) } });
  await assert.rejects(repository.completeUploadBatch({ organizationId: "org-1", employeeId: "employee-1", batchId: "bad", deviceId: "device-1", uploaded: [], duplicates: [], verifyAsset: async () => ({}) }), (error) => error instanceof HttpError && error.statusCode === 404);
});
