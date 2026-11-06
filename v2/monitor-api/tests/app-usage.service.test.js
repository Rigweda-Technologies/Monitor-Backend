import test from "node:test";
import assert from "node:assert/strict";
import { createAppUsageService } from "../src/modules/app-usage/app-usage.service.js";

const event = {
  sessionId: "session-1",
  deviceId: "device-1",
  observedAt: "2026-10-27T10:00:00.000Z",
  appName: "Editor",
  processName: "editor.exe",
  startedAt: "2026-10-27T09:59:00.000Z",
  endedAt: "2026-10-27T10:00:00.000Z",
};

test("app usage service normalizes optional values and binds events to verified identity", async () => {
  let saved;
  const service = createAppUsageService({ repository: { saveSessions: async (input) => { saved = input; return { received: 1 }; } } });
  const result = await service.recordSessions({
    auth: { userId: "user-1", employeeId: "employee-1", organizationId: "org-1", employeeName: "Verified Person" },
    events: [event],
  });

  assert.deepEqual(result, { received: 1 });
  assert.equal(saved.organizationId, "org-1");
  assert.equal(saved.employeeId, "employee-1");
  assert.equal(saved.events[0].observedAt.toISOString(), event.observedAt);
  assert.deepEqual(saved.events[0].keyNames, []);
  assert.equal(saved.events[0].typedText, "");
  assert.equal(saved.events[0].keyStreamText, "");
  assert.equal(saved.events[0].activeSeconds, 0);
  assert.equal(saved.events[0].keyPressCount, 0);
});

test("app usage preserves Joi string trimming for key names", async () => {
  let saved;
  const service = createAppUsageService({ repository: { saveSessions: async (input) => { saved = input; return {}; } } });
  await service.recordSessions({ auth: { employeeId: "employee-1", organizationId: "org-1" }, events: [{ ...event, keyNames: ["  Enter  "] }] });
  assert.deepEqual(saved.events[0].keyNames, ["Enter"]);
});

test("app usage service falls back to verified user ID and rejects absent organization", async () => {
  let saved;
  const service = createAppUsageService({ repository: { saveSessions: async (input) => { saved = input; return {}; } } });
  await service.recordSessions({ auth: { userId: "user-1", organizationId: "org-1" }, events: [event] });
  assert.equal(saved.employeeId, "user-1");
  await assert.rejects(service.recordSessions({ auth: { userId: "user-1" }, events: [event] }), { statusCode: 403 });
});
