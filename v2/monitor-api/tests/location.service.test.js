import test from "node:test";
import assert from "node:assert/strict";
import { createLocationService } from "../src/modules/location/location.service.js";

test("location service checks ownership and never sends coordinates or metadata to persistence", async () => {
  let ownerCheck;
  const service = createLocationService({
    repository: { assertDeviceOwner: async (input) => { ownerCheck = input; } },
    now: () => new Date("2026-10-27T10:00:01.000Z"),
  });
  const report = {
    device_id: "device-1", timestamp: "2026-10-27T10:00:00.000Z", latitude: 17.385, longitude: 78.4867,
    source: "windows_native", metadata: { city: "Hyderabad", region: "Telangana" },
  };
  const response = await service.receiveReport({
    auth: { userId: "user-1", employeeId: "employee-1", organizationId: "org-1", token: "opaque" },
    report,
  });

  assert.deepEqual(ownerCheck, { organizationId: "org-1", employeeId: "employee-1", deviceId: "device-1" });
  assert.deepEqual(response, {
    success: true,
    message: "Location report received",
    data: { device_id: "device-1", receivedAt: "2026-10-27T10:00:01.000Z", source: "windows_native" },
  });
});
