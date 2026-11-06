import { HttpError } from "../errors.js";

const unavailable = () => new HttpError(503, "CLOUDINARY_UNAVAILABLE", "Screenshot provider is temporarily unavailable.");

export const createCloudinaryProvider = ({ client, timeoutMs = 10000, verificationWindowMs = 25000, now = () => Date.now(), delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) => ({
  async createSignedUploadPayload({ settings, folder, publicId, context = {} }) {
    if (!settings?.apiSecret) throw unavailable();
    const timestamp = Math.floor(now() / 1000);
    const params = { folder, public_id: publicId, timestamp, type: "authenticated" };
    if (Object.keys(context).length > 0) {
      params.context = Object.entries(context)
        .map(([key, value]) => `${key}=${String(value).replaceAll("|", " ")}`)
        .join("|");
    }
    return {
      cloudName: settings.cloudName,
      apiKey: settings.apiKey,
      uploadUrl: `https://api.cloudinary.com/v1_1/${settings.cloudName}/image/upload`,
      params: { ...params, signature: client.utils.api_sign_request(params, settings.apiSecret) },
    };
  },

  async uploadBuffer({ settings, buffer, folder, publicId, resourceType = "image" }) {
    if (!settings?.apiSecret) throw unavailable();
    return new Promise((resolve, reject) => {
      try {
        const stream = client.uploader.upload_stream({
          cloud_name: settings.cloudName,
          api_key: settings.apiKey,
          api_secret: settings.apiSecret,
          folder,
          public_id: publicId,
          resource_type: resourceType,
          timeout: timeoutMs,
        }, (error, result) => {
          if (error || !result) return reject(unavailable());
          resolve(result);
        });
        stream.end(buffer);
      } catch {
        reject(unavailable());
      }
    });
  },

  async verifyScreenshotAsset({ settings, row, deadlineAt = now() + verificationWindowMs }) {
    if (!settings?.apiSecret || !row?.cloudinary_public_id) throw unavailable();
    const folder = String(row.cloudinary_folder || "").replace(/^\/+|\/+$/g, "");
    const storedPublicId = row.cloudinary_public_id;
    const publicId = folder && !storedPublicId.startsWith(`${folder}/`) ? `${folder}/${storedPublicId}` : storedPublicId;
    const candidates = [...new Set([publicId, storedPublicId].filter(Boolean))];
    let asset;
    let verifiedPublicId;

    for (const waitMs of [0, 400, 1000, 2000]) {
      if (now() >= deadlineAt) break;
      if (waitMs) await delay(waitMs);
      if (now() >= deadlineAt) break;
      for (const candidate of candidates) {
        for (const type of ["authenticated", "upload"]) {
          const remainingMs = deadlineAt - now();
          if (remainingMs <= 0) break;
          try {
            asset = await client.api.resource(candidate, {
              cloud_name: settings.cloudName,
              api_key: settings.apiKey,
              api_secret: settings.apiSecret,
              resource_type: "image",
              type,
              timeout: Math.max(1, Math.min(timeoutMs, remainingMs)),
            });
            verifiedPublicId = candidate;
            break;
          } catch {
            asset = null;
          }
        }
        if (asset) break;
      }
      if (asset) break;
    }

    if (!asset || asset.public_id !== verifiedPublicId || asset.resource_type !== "image" || !asset.asset_id
        || !Number.isInteger(asset.version) || !asset.secure_url?.startsWith("https://")
        || !Number.isFinite(asset.bytes) || asset.bytes <= 0) throw unavailable();

    return {
      cloudinaryAssetId: asset.asset_id,
      cloudinaryVersion: asset.version,
      cloudinaryFormat: asset.format || null,
      cloudinaryUrl: asset.secure_url,
      sizeBytes: asset.bytes,
    };
  },
});
