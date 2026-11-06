import test from "node:test";
import assert from "node:assert/strict";
import { v2 as cloudinary } from "cloudinary";
import { createCloudinaryProvider } from "../src/integrations/cloudinary-provider.js";

test("Cloudinary signed payload contains only the public key and deterministic signed parameters", async () => {
  const provider = createCloudinaryProvider({ client: cloudinary, now: () => 1_798_000_000_000 });
  const settings = { cloudName: "tenant-cloud", apiKey: "public-key", apiSecret: "private-secret" };
  const payload = await provider.createSignedUploadPayload({ settings, folder: "folder", publicId: "screenshot", context: { batch_id: "batch-1", device_id: "device-1" } });
  const { signature, ...params } = payload.params;
  assert.equal(signature, cloudinary.utils.api_sign_request(params, settings.apiSecret));
  assert.equal(payload.uploadUrl, "https://api.cloudinary.com/v1_1/tenant-cloud/image/upload");
  assert.equal(JSON.stringify(payload).includes(settings.apiSecret), false);
});

test("Cloudinary provider rejects unverified provider assets with a safe 503", async () => {
  const provider = createCloudinaryProvider({ client: { api: { resource: async () => { throw new Error("private provider response"); } } }, delay: async () => {} });
  await assert.rejects(provider.verifyScreenshotAsset({
    settings: { cloudName: "tenant-cloud", apiKey: "public", apiSecret: "private" },
    row: { cloudinary_public_id: "folder/image", cloudinary_folder: "folder" },
  }), (error) => error.statusCode === 503 && !error.message.includes("private provider response"));
});
