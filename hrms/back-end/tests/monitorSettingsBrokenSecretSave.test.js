const test = require("node:test");
const assert = require("node:assert/strict");
const monitorDb = require("../src/config/monitorDb");
const service = require("../src/modules/agent/agent.monitorSettings.service");

const existingRow = (overrides = {}) => ({
  organization_id: "org-1",
  cloud_name: "cloud-one",
  api_key: "key-one",
  api_secret_ciphertext: Buffer.from("old-secret").toString("base64"),
  api_secret_iv: Buffer.alloc(12, 1).toString("base64"),
  api_secret_auth_tag: Buffer.alloc(20, 2).toString("base64"),
  upload_folder_root: "old-folder",
  screenshots_enabled: true,
  mouse_enabled: true,
  keyboard_enabled: true,
  app_usage_enabled: true,
  browser_history_enabled: false,
  usb_enabled: true,
  screenshot_interval_minutes: 1,
  mouse_heartbeat_minutes: 1,
  mouse_idle_threshold_minutes: 1,
  keyboard_heartbeat_minutes: 1,
  app_usage_heartbeat_minutes: 1,
  browser_history_sync_minutes: 1,
  ...overrides
});

const payload = (overrides = {}) => ({
  cloudName: "cloud-one", apiKey: "key-one", apiSecret: "", uploadFolderRoot: "new-folder",
  screenshotsEnabled: false, mouseEnabled: true, keyboardEnabled: true, appUsageEnabled: true,
  browserHistoryEnabled: false, usbEnabled: true, screenshotIntervalMinutes: 5,
  mouseHeartbeatMinutes: 1, mouseIdleThresholdMinutes: 1, keyboardHeartbeatMinutes: 1,
  appUsageHeartbeatMinutes: 1, browserHistorySyncMinutes: 1, ...overrides
});

const stubPool = (t, row) => {
  let stored;
  t.mock.method(monitorDb, "getMonitorPgPool", async () => ({
    async query(sql, params = []) {
      if (sql.includes("information_schema.columns")) {
        return { rows: ["screenshots_enabled", "mouse_enabled", "keyboard_enabled", "app_usage_enabled",
          "browser_history_enabled", "usb_enabled", "screenshot_interval_minutes", "mouse_heartbeat_minutes",
          "mouse_idle_threshold_minutes", "keyboard_heartbeat_minutes", "app_usage_heartbeat_minutes",
          "browser_history_sync_minutes"].map((column_name) => ({ column_name })) };
      }
      if (sql.includes("SELECT * FROM monitor_cloudinary_settings")) return { rows: row ? [row] : [] };
      if (sql.includes("INSERT INTO monitor_cloudinary_settings")) {
        stored = {
          ...row,
          organization_id: params[0], cloud_name: params[1], api_key: params[2],
          api_secret_ciphertext: params[3], api_secret_iv: params[4], api_secret_auth_tag: params[5],
          upload_folder_root: params[6], screenshots_enabled: params[7], screenshot_interval_minutes: params[13]
        };
        return { rows: [stored] };
      }
      return { rows: [] };
    }
  }));
  return () => stored;
};

test("new secret replaces a corrupt row without decrypting the old secret", async (t) => {
  const old = existingRow();
  const getStored = stubPool(t, old);
  await service.saveSettings("org-1", payload({ apiSecret: "replacement-secret" }));
  const saved = getStored();
  assert.equal(Buffer.from(saved.api_secret_iv, "base64").length, 12);
  assert.equal(Buffer.from(saved.api_secret_auth_tag, "base64").length, 16);
  assert.notEqual(saved.api_secret_ciphertext, old.api_secret_ciphertext);
});

test("blank secret with changed Cloudinary credentials and corrupt row returns a clear 400", async (t) => {
  stubPool(t, existingRow());
  await assert.rejects(service.saveSettings("org-1", payload({ cloudName: "cloud-two" })), (error) =>
    error.code === 400 && error.message === "Saved secret is unreadable; enter the API secret again");
});

test("settings-only save works with a corrupt secret and preserves its encrypted fields", async (t) => {
  const old = existingRow();
  const getStored = stubPool(t, old);
  await service.saveSettings("org-1", payload());
  const saved = getStored();
  assert.equal(saved.api_secret_ciphertext, old.api_secret_ciphertext);
  assert.equal(saved.api_secret_iv, old.api_secret_iv);
  assert.equal(saved.api_secret_auth_tag, old.api_secret_auth_tag);
  assert.equal(saved.upload_folder_root, "new-folder");
  assert.equal(saved.screenshots_enabled, false);
});
