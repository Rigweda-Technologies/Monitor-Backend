const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeArtifactType } = require("../src/modules/monitorUpdates/monitorUpdates.service");

test("monitor update artifact defaults to legacy executable", () => {
  assert.equal(normalizeArtifactType(undefined, "RigwedaMonitor.exe"), "executable");
});

test("monitor update package is selected explicitly or by zip file name", () => {
  assert.equal(normalizeArtifactType("package"), "package");
  assert.equal(normalizeArtifactType(undefined, "RigwedaMonitorUpdate.zip"), "package");
  assert.equal(normalizeArtifactType("zip"), "package");
  assert.equal(normalizeArtifactType(undefined, "upload.bin", Buffer.from([0x50, 0x4b, 0x03, 0x04])), "package");
});
