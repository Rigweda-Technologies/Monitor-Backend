const test = require("node:test");
const assert = require("node:assert/strict");

const { __test } = require("../src/modules/agent/agent.monitorSettings.service");

test("public monitor settings do not decrypt or reveal the stored Cloudinary secret", () => {
  const settings = __test.toPublicSettings({
    cloud_name: "tenant-cloud",
    api_key: "public-key",
    api_secret_ciphertext: "legacy-or-unreadable-ciphertext",
    upload_folder_root: "rigweda-monitor"
  });

  assert.equal(settings.cloudName, "tenant-cloud");
  assert.equal(settings.apiKey, "public-key");
  assert.equal(settings.apiSecretMasked, "******");
  assert.equal("apiSecret" in settings, false);
});

test("public monitor settings report when no Cloudinary secret is stored", () => {
  const settings = __test.toPublicSettings({
    cloud_name: "tenant-cloud",
    api_key: "public-key",
    api_secret_ciphertext: ""
  });

  assert.equal(settings.apiSecretMasked, "");
});
