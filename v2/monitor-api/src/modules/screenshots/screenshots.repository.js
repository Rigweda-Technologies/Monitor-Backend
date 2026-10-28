import { Prisma } from "@prisma/client";
import { HttpError } from "../../errors.js";
import { lockAndAssertDeviceOwner } from "../device-ownership/device-ownership.repository.js";

const unavailable = () => new HttpError(404, "SCREENSHOT_NOT_FOUND", "Screenshot batch or item not found for this account.");
const collision = () => new HttpError(409, "SCREENSHOT_ID_CONFLICT", "Screenshot identifier is not available for this account.");

export const createScreenshotsRepository = ({ prisma }) => ({
  async createUploadBatch({ batch, rows }) {
    return prisma.$transaction(async (tx) => {
      await lockAndAssertDeviceOwner({ transaction: tx, deviceId: batch.deviceId, organizationId: batch.organizationId, employeeId: batch.employeeId });
      const foundBatch = await tx.monitorScreenshotBatch.findUnique({ where: { deviceId_id: { deviceId: batch.deviceId, id: batch.id } } });
      if (foundBatch && (foundBatch.organizationId !== batch.organizationId || foundBatch.employeeId !== batch.employeeId)) throw collision();
      const storedBatch = foundBatch
        ? await tx.monitorScreenshotBatch.update({ where: { deviceId_id: { deviceId: batch.deviceId, id: batch.id } }, data: { expectedCount: batch.expectedCount, expectedBytes: batch.expectedBytes, firstCapturedAt: batch.firstCapturedAt, lastCapturedAt: batch.lastCapturedAt } })
        : await tx.monitorScreenshotBatch.create({ data: batch });
      const output = [];
      for (const row of rows) {
        const key = { deviceId_clientScreenshotId: { deviceId: row.deviceId, clientScreenshotId: row.clientScreenshotId } };
        const found = await tx.monitorScreenshot.findUnique({ where: key });
        if (found && (found.organizationId !== row.organizationId || found.employeeId !== row.employeeId)) throw collision();
        const source = await tx.monitorScreenshot.findFirst({
          where: { organizationId: row.organizationId, employeeId: row.employeeId, sha256: row.sha256, uploadStatus: "uploaded", cloudinaryPublicId: { not: null } },
          orderBy: { capturedAt: "desc" },
        });
        const saved = found
          ? await tx.monitorScreenshot.update({ where: key, data: { batchId: storedBatch.id, sizeBytes: row.sizeBytes, cloudinaryFolder: row.cloudinaryFolder, cloudinaryPublicId: row.cloudinaryPublicId } })
          : await tx.monitorScreenshot.create({ data: row });
        output.push({ ...saved, duplicate: source && source.id !== saved.id ? source : null });
      }
      return { batch: storedBatch, rows: output };
    });
  },

  async completeUploadBatch({ organizationId, employeeId, batchId, deviceId, uploaded, duplicates, verifyAsset }) {
    return prisma.$transaction(async (tx) => {
      await lockAndAssertDeviceOwner({ transaction: tx, deviceId, organizationId, employeeId });
      await tx.$queryRaw(Prisma.sql`
        SELECT id FROM monitor_screenshot_batches
        WHERE id = ${batchId} AND device_id = ${deviceId}
          AND organization_id = ${organizationId} AND employee_id = ${employeeId}
        FOR UPDATE
      `);
      const batch = await tx.monitorScreenshotBatch.findFirst({ where: { id: batchId, deviceId, organizationId, employeeId } });
      if (!batch) throw unavailable();
      const ids = [...uploaded, ...duplicates].map((item) => item.clientScreenshotId);
      await tx.$queryRaw(Prisma.sql`
        SELECT id FROM monitor_screenshots
        WHERE batch_id = ${batchId} AND device_id = ${deviceId}
          AND organization_id = ${organizationId} AND employee_id = ${employeeId}
          AND client_screenshot_id = ANY(${ids}::text[])
        FOR UPDATE
      `);
      const rows = await tx.monitorScreenshot.findMany({ where: { batchId, deviceId, organizationId, employeeId, clientScreenshotId: { in: ids } } });
      if (rows.length !== ids.length) throw unavailable();
      const byClientId = new Map(rows.map((row) => [row.clientScreenshotId, row]));
      for (const entry of uploaded) {
        const row = byClientId.get(entry.clientScreenshotId);
        const asset = await verifyAsset(row);
        await tx.monitorScreenshot.update({ where: { id: row.id }, data: {
          cloudinaryAssetId: asset.cloudinaryAssetId,
          cloudinaryVersion: asset.cloudinaryVersion === null || asset.cloudinaryVersion === undefined ? null : BigInt(asset.cloudinaryVersion),
          cloudinaryFormat: asset.cloudinaryFormat, cloudinaryUrl: asset.cloudinaryUrl,
          sizeBytes: asset.sizeBytes ? BigInt(asset.sizeBytes) : row.sizeBytes,
          uploadStatus: "uploaded", errorMessage: null, uploadedAt: new Date(),
        } });
      }
      for (const entry of duplicates) {
        const target = byClientId.get(entry.clientScreenshotId);
        const source = await tx.monitorScreenshot.findFirst({ where: {
          id: entry.duplicateOf, organizationId, employeeId, sha256: target.sha256,
          uploadStatus: "uploaded", cloudinaryPublicId: { not: null },
        } });
        if (!source || source.id === target.id) throw unavailable();
        await verifyAsset(source);
        await tx.monitorScreenshot.update({ where: { id: target.id }, data: { duplicateOf: source.id, uploadStatus: "duplicate", processingStatus: "complete", uploadedAt: new Date() } });
      }
      const counts = await tx.monitorScreenshot.groupBy({
        by: ["uploadStatus"], where: { batchId, deviceId, organizationId, employeeId },
        _count: { _all: true }, _sum: { sizeBytes: true },
      });
      const uploadedCount = counts.find((item) => item.uploadStatus === "uploaded")?._count._all || 0;
      const duplicateCount = counts.find((item) => item.uploadStatus === "duplicate")?._count._all || 0;
      const uploadedBytes = counts.find((item) => item.uploadStatus === "uploaded")?._sum.sizeBytes || 0n;
      const complete = uploadedCount + duplicateCount >= batch.expectedCount;
      return tx.monitorScreenshotBatch.update({
        where: { deviceId_id: { deviceId, id: batchId } },
        data: { uploadedCount, duplicateCount, uploadedBytes, status: complete ? "complete" : "partial", ...(complete ? { completedAt: new Date() } : {}) },
      });
    }, { maxWait: 5000, timeout: 35000 });
  },

  async createDirectScreenshot(record) {
    return prisma.$transaction(async (tx) => {
      await lockAndAssertDeviceOwner({ transaction: tx, deviceId: record.deviceId, organizationId: record.organizationId, employeeId: record.employeeId });
      const key = { deviceId_clientScreenshotId: { deviceId: record.deviceId, clientScreenshotId: record.clientScreenshotId } };
      const existing = await tx.monitorScreenshot.findUnique({ where: key });
      if (existing && (existing.organizationId !== record.organizationId || existing.employeeId !== record.employeeId)) throw collision();
      return existing
        ? tx.monitorScreenshot.update({ where: key, data: { cloudinaryFolder: record.cloudinaryFolder, cloudinaryPublicId: record.cloudinaryPublicId, cloudinaryAssetId: record.cloudinaryAssetId, cloudinaryUrl: record.cloudinaryUrl, uploadStatus: "uploaded", uploadedAt: new Date() } })
        : tx.monitorScreenshot.create({ data: { ...record, uploadStatus: "uploaded", processingStatus: "pending", uploadedAt: new Date() } });
    });
  },
});
