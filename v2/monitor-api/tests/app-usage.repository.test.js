import test from "node:test";
import assert from "node:assert/strict";
import { createAppUsageRepository } from "../src/modules/app-usage/app-usage.repository.js";
import { DeviceOwnershipConflictError } from "../src/errors.js";

const event = {
  sessionId: "session-1", deviceId: "device-1", observedAt: new Date("2026-10-27T10:00:00.000Z"),
  appName: "Editor", processName: "editor.exe", startedAt: new Date("2026-10-27T09:59:00.000Z"),
  endedAt: new Date("2026-10-27T10:00:00.000Z"), activeSeconds: 60, keyPressCount: 2,
  keyNames: ["A", "B"], typedText: "private typed text", keyStreamText: "private key stream",
};

const makePrisma = ({ deviceConflict = false, sessionConflict = false } = {}) => {
  const queries = [];
  let rolledBack = false;
  const transaction = {
    async $queryRaw(query) {
      queries.push(query);
      if (query.sql.includes("SELECT 1 AS conflict")) return deviceConflict ? [{ conflict: 1 }] : [];
      if (query.sql.includes("SELECT 1 AS session_conflict")) return sessionConflict ? [{ conflict: 1 }] : [];
      if (query.sql.includes("INSERT INTO monitor_app_usage_sessions")) return [{ session_id: "session-1" }];
      return [];
    },
  };
  const prisma = { async $transaction(work) { try { return await work(transaction); } catch (error) { rolledBack = true; throw error; } } };
  return { prisma, queries, get rolledBack() { return rolledBack; } };
};

test("app usage repository upserts a batch in one transaction with parameterized sensitive values", async () => {
  const mock = makePrisma();
  const repository = createAppUsageRepository({ prisma: mock.prisma });
  const result = await repository.saveSessions({ organizationId: "org-1", employeeId: "employee-1", employeeName: "Person", events: [event] });

  assert.deepEqual(result, { received: 1, employeeId: "employee-1", organizationId: "org-1" });
  assert.ok(mock.queries.some((query) => query.sql.includes("ON CONFLICT (device_id, session_id) DO UPDATE")));
  const insert = mock.queries.find((query) => query.sql.includes("INSERT INTO monitor_app_usage_sessions"));
  assert.ok(insert.values.includes("private typed text"));
  assert.ok(insert.values.includes("private key stream"));
  assert.ok(insert.sql.includes("typed_text"));
});

test("app usage repository rejects conflicting device ownership before writing", async () => {
  const mock = makePrisma({ deviceConflict: true });
  const repository = createAppUsageRepository({ prisma: mock.prisma });
  await assert.rejects(repository.saveSessions({ organizationId: "org-1", employeeId: "employee-1", events: [event] }), DeviceOwnershipConflictError);
  assert.equal(mock.rolledBack, true);
  assert.equal(mock.queries.some((query) => query.sql.includes("INSERT INTO monitor_app_usage_sessions")), false);
});

test("app usage repository rejects a session ID already owned by another device or employee", async () => {
  const mock = makePrisma({ sessionConflict: true });
  const repository = createAppUsageRepository({ prisma: mock.prisma });
  await assert.rejects(repository.saveSessions({ organizationId: "org-1", employeeId: "employee-1", events: [event] }), DeviceOwnershipConflictError);
  assert.equal(mock.rolledBack, true);
  assert.equal(mock.queries.some((query) => query.sql.includes("INSERT INTO monitor_app_usage_sessions")), false);
});
