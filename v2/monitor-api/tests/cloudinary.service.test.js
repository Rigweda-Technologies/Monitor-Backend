import test from "node:test";
import assert from "node:assert/strict";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { createCloudinaryService } from "../src/modules/cloudinary/cloudinary.service.js";

const secret = "synthetic-provider-secret";
const settingsRow = (key) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(key).digest(), iv);
  const encrypted = Buffer.concat([cipher.update(secret), cipher.final()]);
  return {
    organizationId: "org-1", cloudName: "tenant-cloud", apiKey: "public-key",
    apiSecretCiphertext: encrypted.toString("base64"), apiSecretIv: iv.toString("base64"),
    apiSecretAuthTag: cipher.getAuthTag().toString("base64"), uploadFolderRoot: "rigweda-monitor",
    screenshotsEnabled: true, mouseEnabled: true, keyboardEnabled: false, updatedAt: new Date("2026-10-27T10:00:00.000Z"),
  };
};

test("Cloudinary service decrypts settings only for the requested organization and returns allowlisted config", async () => {
  let requestedOrganizationId;
  let signedWith;
  const service = createCloudinaryService({
    repository: { findByOrganizationId: async (organizationId) => { requestedOrganizationId = organizationId; return settingsRow("settings-key"); } },
    provider: { createSignedUploadPayload: async ({ settings }) => { signedWith = settings.apiSecret; return {}; } },
    settingsSecret: "settings-key",
  });
  const config = await service.getPublicUploadConfig({ organizationId: "org-1" });
  await service.createSignedUploadPayload({ organizationId: "org-1", folder: "folder", publicId: "image" });
  assert.equal(requestedOrganizationId, "org-1");
  assert.equal(signedWith, secret);
  assert.deepEqual(config, {
    cloudName: "tenant-cloud", apiKey: "public-key", uploadFolderRoot: "rigweda-monitor",
    screenshotsEnabled: true, mouseEnabled: true, keyboardEnabled: false, updatedAt: new Date("2026-10-27T10:00:00.000Z"),
  });
  assert.equal(JSON.stringify(config).includes(secret), false);
});

test("Cloudinary service never falls back across tenants and reports missing settings", async () => {
  const service = createCloudinaryService({
    repository: { findByOrganizationId: async () => null },
    provider: {},
    settingsSecret: "settings-key",
  });
  assert.equal(await service.resolveSettings({ organizationId: "unconfigured", allowMissing: true }), null);
  assert.equal(await service.getPublicUploadConfig({ organizationId: "unconfigured" }), null);
  await assert.rejects(service.getPublicUploadConfig({}), { statusCode: 403 });
});

test("Cloudinary service fails safely when encryption key is unavailable or incorrect", async () => {
  const row = settingsRow("right-key");
  const repository = { findByOrganizationId: async () => row };
  const unavailable = createCloudinaryService({ repository, provider: {}, settingsSecret: "" });
  const incorrect = createCloudinaryService({ repository, provider: {}, settingsSecret: "wrong-key" });
  await assert.rejects(unavailable.getPublicUploadConfig({ organizationId: "org-1" }), { statusCode: 503 });
  await assert.rejects(incorrect.getPublicUploadConfig({ organizationId: "org-1" }), { statusCode: 503 });
});
