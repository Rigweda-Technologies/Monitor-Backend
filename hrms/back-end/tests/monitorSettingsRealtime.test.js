const test = require("node:test");
const assert = require("node:assert/strict");

const { buildMonitorSettingsSignal } = require("../src/modules/agent/agent.monitorSettings.controller");

test("monitor settings realtime event is signal-only", () => {
  const updatedAt = "2026-11-06T08:00:00.000Z";
  const signal = buildMonitorSettingsSignal({
    updatedAt,
    screenshotsEnabled: false,
    apiSecretMasked: "********",
  });

  assert.deepEqual(signal, {
    version: updatedAt,
    updatedAt,
    source: "cloudinary-settings-save",
  });
  assert.equal("settings" in signal, false);
  assert.equal(JSON.stringify(signal).includes("apiSecret"), false);
});

test("monitor settings signal tolerates a missing timestamp", () => {
  assert.deepEqual(buildMonitorSettingsSignal(null), {
    version: null,
    updatedAt: null,
    source: "cloudinary-settings-save",
  });
});
