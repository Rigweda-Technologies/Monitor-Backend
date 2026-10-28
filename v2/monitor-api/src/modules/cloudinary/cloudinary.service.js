import { createDecipheriv, createHash } from "node:crypto";
import { HttpError } from "../../errors.js";

const decryptSecret = ({ row, settingsSecret }) => {
  if (!settingsSecret) throw new HttpError(503, "CLOUDINARY_CONFIGURATION_UNAVAILABLE", "Cloudinary settings cannot be read on this service.");
  try {
    const key = createHash("sha256").update(settingsSecret).digest();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(row.apiSecretIv, "base64"));
    decipher.setAuthTag(Buffer.from(row.apiSecretAuthTag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(row.apiSecretCiphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new HttpError(503, "CLOUDINARY_CONFIGURATION_UNAVAILABLE", "Cloudinary settings cannot be read on this service.");
  }
};

export const toPublicUploadConfig = (settings) => ({
  cloudName: settings.cloudName,
  apiKey: settings.apiKey,
  uploadFolderRoot: settings.uploadFolderRoot || "rigweda-monitor",
  screenshotsEnabled: settings.screenshotsEnabled ?? true,
  mouseEnabled: settings.mouseEnabled ?? true,
  keyboardEnabled: settings.keyboardEnabled ?? true,
  updatedAt: settings.updatedAt,
});

export const createCloudinaryService = ({ repository, provider, settingsSecret = "" }) => {
  const resolveSettings = async ({ organizationId, allowMissing = false } = {}) => {
    const scopedOrganizationId = String(organizationId || "").trim();
    if (!scopedOrganizationId) throw new HttpError(403, "ORGANIZATION_REQUIRED", "Organization is required for Cloudinary settings.");
    const row = await repository.findByOrganizationId(scopedOrganizationId);
    if (!row) {
      if (allowMissing) return null;
      throw new HttpError(404, "CLOUDINARY_SETTINGS_NOT_FOUND", "Cloudinary settings are not configured for this organization.");
    }
    return {
      organizationId: row.organizationId,
      cloudName: row.cloudName,
      apiKey: row.apiKey,
      apiSecret: decryptSecret({ row, settingsSecret }),
      uploadFolderRoot: row.uploadFolderRoot || "rigweda-monitor",
      screenshotsEnabled: row.screenshotsEnabled ?? true,
      mouseEnabled: row.mouseEnabled ?? true,
      keyboardEnabled: row.keyboardEnabled ?? true,
      updatedAt: row.updatedAt,
    };
  };

  return {
    resolveSettings,
    async getPublicUploadConfig({ organizationId }) {
      const settings = await resolveSettings({ organizationId, allowMissing: true });
      return settings ? toPublicUploadConfig(settings) : null;
    },
    async createSignedUploadPayload({ organizationId, ...input }) {
      const settings = await resolveSettings({ organizationId });
      return provider.createSignedUploadPayload({ settings, ...input });
    },
    async uploadBuffer({ organizationId, ...input }) {
      const settings = await resolveSettings({ organizationId });
      return provider.uploadBuffer({ settings, ...input });
    },
    async verifyScreenshotAsset({ organizationId, row, deadlineAt, settings: suppliedSettings }) {
      const settings = suppliedSettings || await resolveSettings({ organizationId });
      return provider.verifyScreenshotAsset({ settings, row, deadlineAt });
    },
  };
};
