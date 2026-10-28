import { createHash, randomUUID } from "node:crypto";
import { HttpError, MissingOrganizationIdentityError } from "../../errors.js";

const dateFolder = (value) => new Date(value).toISOString().slice(0, 10).replaceAll("-", "_");
const safePart = (value) => String(value).toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const identity = (auth) => {
  const organizationId = String(auth?.organizationId || "").trim();
  const employeeId = String(auth?.employeeId || auth?.userId || "").trim();
  if (!organizationId || !employeeId) throw new MissingOrganizationIdentityError();
  return { organizationId, employeeId, employeeName: auth.employeeName || null };
};
const jsonSafeScreenshot = (record) => ({
  ...record,
  ...(typeof record.sizeBytes === "bigint" ? { sizeBytes: record.sizeBytes.toString() } : {}),
  ...(typeof record.cloudinaryVersion === "bigint" ? { cloudinaryVersion: record.cloudinaryVersion.toString() } : {}),
});
const toV1ScreenshotRow = (row) => ({
  id: row.id,
  batch_id: row.batchId,
  organization_id: row.organizationId,
  employee_id: row.employeeId,
  device_id: row.deviceId,
  client_screenshot_id: row.clientScreenshotId,
  captured_at: row.capturedAt,
  original_file_name: row.originalFileName,
  mime_type: row.mimeType,
  width: row.width,
  height: row.height,
  sha256: row.sha256,
  size_bytes: typeof row.sizeBytes === "bigint" ? row.sizeBytes.toString() : row.sizeBytes,
  cloudinary_folder: row.cloudinaryFolder,
  cloudinary_public_id: row.cloudinaryPublicId,
  cloudinary_asset_id: row.cloudinaryAssetId,
  cloudinary_version: row.cloudinaryVersion === null || row.cloudinaryVersion === undefined ? null : String(row.cloudinaryVersion),
  cloudinary_format: row.cloudinaryFormat,
  cloudinary_url: row.cloudinaryUrl,
  duplicate_of: row.duplicateOf,
  upload_status: row.uploadStatus,
  processing_status: row.processingStatus,
  error_message: row.errorMessage,
  created_at: row.createdAt,
  uploaded_at: row.uploadedAt,
});
const toV1BatchRow = (row) => ({
  id: row.id,
  organization_id: row.organizationId,
  employee_id: row.employeeId,
  device_id: row.deviceId,
  status: row.status,
  expected_count: row.expectedCount,
  uploaded_count: row.uploadedCount,
  duplicate_count: row.duplicateCount,
  expected_bytes: typeof row.expectedBytes === "bigint" ? row.expectedBytes.toString() : row.expectedBytes,
  uploaded_bytes: typeof row.uploadedBytes === "bigint" ? row.uploadedBytes.toString() : row.uploadedBytes,
  first_captured_at: row.firstCapturedAt,
  last_captured_at: row.lastCapturedAt,
  created_at: row.createdAt,
  completed_at: row.completedAt,
});

export const createScreenshotsService = ({ repository, cloudinaryService, now = () => Date.now(), verificationWindowMs = 25000 }) => ({
  async createUploadSession({ auth, batchId, deviceId, screenshots }) {
    const owner = identity(auth);
    const scopedBatchId = String(batchId || "").trim();
    const scopedDeviceId = String(deviceId || "").trim();
    const settings = await cloudinaryService.resolveSettings({ organizationId: owner.organizationId, allowMissing: true });
    const firstCapturedAt = new Date(screenshots[0].capturedAt);
    const lastCapturedAt = new Date(screenshots.at(-1).capturedAt);
    if (!settings) return {
      batchId: scopedBatchId, employeeId: owner.employeeId, deviceId: scopedDeviceId, expiresInSeconds: 300,
      deferred: true, reason: "Cloudinary settings are not configured yet.", uploads: [],
    };

    const folderRoot = String(settings.uploadFolderRoot || "rigweda-monitor").replace(/^\/+|\/+$/g, "");
    const rows = screenshots.map((item) => {
      const capturedAt = new Date(item.capturedAt);
      const timestamp = capturedAt.toISOString().replace(/[-:.]/g, "").replace("T", "_").replace("Z", "");
      const publicId = `${timestamp}_${safePart(item.clientScreenshotId).slice(-12)}_${item.sha256.slice(0, 12)}`;
      return {
        id: randomUUID(), batchId: scopedBatchId, ...owner, deviceId: scopedDeviceId,
        clientScreenshotId: item.clientScreenshotId.trim(), capturedAt,
        originalFileName: item.originalFileName.trim(), mimeType: item.mimeType,
        width: item.width ?? null, height: item.height ?? null,
        sha256: item.sha256, sizeBytes: BigInt(item.sizeBytes),
        cloudinaryFolder: `${folderRoot}/${owner.employeeId}/${dateFolder(capturedAt)}`,
        cloudinaryPublicId: publicId,
      };
    });
    const existingBatch = await repository.createUploadBatch({
      batch: {
        id: scopedBatchId, ...owner, deviceId: scopedDeviceId, expectedCount: rows.length,
        expectedBytes: rows.reduce((sum, row) => sum + row.sizeBytes, 0n), firstCapturedAt, lastCapturedAt,
      }, rows,
    });
    const uploads = [];
    for (const row of existingBatch.rows) {
      if (row.duplicate) {
        uploads.push({ clientScreenshotId: row.clientScreenshotId, status: "duplicate", duplicateOf: row.duplicate.id, cloudinaryUrl: row.duplicate.cloudinaryUrl });
        continue;
      }
      uploads.push({
        clientScreenshotId: row.clientScreenshotId,
        status: "upload",
        cloudinaryPublicId: row.cloudinaryPublicId,
        ...(await cloudinaryService.createSignedUploadPayload({
          organizationId: owner.organizationId, folder: row.cloudinaryFolder, publicId: row.cloudinaryPublicId,
          context: { batch_id: scopedBatchId, employee_id: owner.employeeId, device_id: scopedDeviceId, captured_at: row.capturedAt.toISOString(), sha256: row.sha256 },
        })),
      });
    }
    return { batchId: scopedBatchId, employeeId: owner.employeeId, deviceId: scopedDeviceId, expiresInSeconds: 300, uploads };
  },

  async completeUploadSession({ auth, batchId, deviceId, uploaded = [], duplicates = [] }) {
    const owner = identity(auth);
    const normalizedUploaded = uploaded.map((entry) => ({ ...entry, clientScreenshotId: String(entry.clientScreenshotId).trim() }));
    const normalizedDuplicates = duplicates.map((entry) => ({ ...entry, clientScreenshotId: String(entry.clientScreenshotId).trim(), duplicateOf: String(entry.duplicateOf).trim() }));
    const scopedBatchId = String(batchId || "").trim();
    const scopedDeviceId = String(deviceId || "").trim();
    const ids = [...normalizedUploaded, ...normalizedDuplicates].map((entry) => entry.clientScreenshotId);
    if (new Set(ids).size !== ids.length) throw new HttpError(400, "VALIDATION_ERROR", "Repeated screenshot IDs.");
    const settings = await cloudinaryService.resolveSettings({ organizationId: owner.organizationId });
    const deadlineAt = now() + verificationWindowMs;
    const result = await repository.completeUploadBatch({
      ...owner, batchId: scopedBatchId, deviceId: scopedDeviceId, uploaded: normalizedUploaded, duplicates: normalizedDuplicates,
      verifyAsset: (row) => cloudinaryService.verifyScreenshotAsset({
        organizationId: owner.organizationId,
        deadlineAt,
        settings,
        row: {
          cloudinary_folder: row.cloudinaryFolder,
          cloudinary_public_id: row.cloudinaryPublicId,
        },
      }),
    });
    return { ...toV1BatchRow(result), acknowledgedScreenshotIds: ids };
  },

  async createDirectScreenshot({ auth, file, capturedAt }) {
    const owner = identity(auth);
    const settings = await cloudinaryService.resolveSettings({ organizationId: owner.organizationId });
    const capturedDate = new Date(capturedAt);
    const folder = `${String(settings.uploadFolderRoot || "rigweda-monitor").replace(/^\/+|\/+$/g, "")}/${owner.employeeId}/${dateFolder(capturedDate)}`;
    const originalFileName = "screenshot";
    const mimeType = "application/octet-stream";
    const publicId = originalFileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const uploaded = await cloudinaryService.uploadBuffer({ organizationId: owner.organizationId, buffer: file.buffer, folder, publicId });
    const record = await repository.createDirectScreenshot({
      id: randomUUID(), ...owner, deviceId: "legacy", clientScreenshotId: randomUUID(), capturedAt: capturedDate,
      originalFileName, mimeType,
      sha256: createHash("sha256").update(file.buffer).digest("hex"), sizeBytes: BigInt(file.buffer.length),
      cloudinaryFolder: folder, cloudinaryPublicId: publicId,
      cloudinaryAssetId: uploaded.asset_id || null, cloudinaryVersion: null,
      cloudinaryFormat: null, cloudinaryUrl: uploaded.secure_url,
    });
    return toV1ScreenshotRow(jsonSafeScreenshot(record));
  },
});
