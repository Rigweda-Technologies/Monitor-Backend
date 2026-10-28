import test from "node:test";
import assert from "node:assert/strict";
import { createActivityRepository } from "../src/modules/activity/activity.repository.js";
import { toDateKeyInTimeZone } from "../src/modules/activity/activity.service.js";
import { DeviceOwnershipConflictError } from "../src/errors.js";

const identity = {
  organizationId: "org-1",
  employeeId: "employee-1",
  employeeName: "Test User",
  activityTimeZone: "Asia/Kolkata",
};

const event = {
  eventId: "event-1",
  deviceId: "device-1",
  observedAt: new Date("2026-10-27T18:45:00.000Z"),
  status: "active",
  activeSeconds: 30,
  idleSeconds: 0,
};

const makePrisma = (activityResult, presenceResult, { ownerConflict = false } = {}) => {
  const queries = [];
  let transactionRolledBack = false;
  const tx = {
    async $queryRaw(query) {
      queries.push(query);
      if (query.sql.includes("pg_advisory_xact_lock")) return [];
      if (query.sql.includes("SELECT 1 AS conflict")) return ownerConflict ? [{ conflict: 1 }] : [];
      if (query.sql.includes("INSERT INTO monitor_activity_events")) return activityResult;
      if (query.sql.includes("INSERT INTO monitor_device_presence")) return presenceResult;
      throw new Error("Unexpected test query.");
    },
  };
  return {
    queries,
    get transactionRolledBack() { return transactionRolledBack; },
    async $transaction(work) {
      try {
        return await work(tx);
      } catch (error) {
        transactionRolledBack = true;
        throw error;
      }
    },
  };
};

test("activity repository reports inserts and duplicate events atomically", async () => {
  const prisma = makePrisma([{ inserted: true }], [{ device_id: "device-1" }]);
  const repository = createActivityRepository({ prisma, now: () => new Date("2026-10-27T18:45:30.000Z") });

  const result = await repository.saveEvents({ ...identity, events: [event] });

  assert.deepEqual(result, { inserted: 1, saved: 1, duplicateCount: 0 });
  assert.equal(prisma.queries.length, 4);
  const activitySql = prisma.queries.find((query) => query.sql.includes("INSERT INTO monitor_activity_events")).sql;
  const presenceSql = prisma.queries.find((query) => query.sql.includes("INSERT INTO monitor_device_presence")).sql;
  assert.match(prisma.queries[0].sql, /pg_advisory_xact_lock/);
  assert.match(prisma.queries[0].sql, /MATERIALIZED/);
  assert.match(prisma.queries[0].sql, /TRUE AS lock_acquired/);
  assert.match(activitySql, /ON CONFLICT/);
  assert.match(activitySql, /event_ids/);
  assert.match(presenceSql, /IS NOT DISTINCT FROM/);
});

test("activity response counts a second unique same-day event as saved, matching v1", async () => {
  const prisma = makePrisma([{ inserted: false }], [{ device_id: "device-1" }]);
  const repository = createActivityRepository({ prisma });
  const result = await repository.saveEvents({ ...identity, events: [event] });
  assert.deepEqual(result, { inserted: 1, saved: 1, duplicateCount: 0 });
});

test("device ownership conflict rejects and rolls back the entire batch", async () => {
  const prisma = makePrisma([{ inserted: true }], []);
  const repository = createActivityRepository({ prisma, now: () => new Date("2026-10-27T18:45:30.000Z") });

  await assert.rejects(
    repository.saveEvents({ ...identity, events: [event] }),
    DeviceOwnershipConflictError,
  );
  assert.equal(prisma.transactionRolledBack, true);
});

test("activity rejects a device already owned by a different browser-history owner", async () => {
  const prisma = makePrisma([{ inserted: true }], [{ device_id: "device-1" }], { ownerConflict: true });
  const repository = createActivityRepository({ prisma, now: () => new Date("2026-10-27T18:45:30.000Z") });

  await assert.rejects(repository.saveEvents({ ...identity, events: [event] }), DeviceOwnershipConflictError);
  assert.equal(prisma.transactionRolledBack, true);
  assert.equal(prisma.queries.some((query) => query.sql.includes("INSERT INTO monitor_activity_events")), false);
});

test("repository preserves daily idempotency, additive counters, latest state and presence freshness rules", async () => {
  const prisma = makePrisma([], [{ device_id: "device-1" }]);
  const repository = createActivityRepository({ prisma, now: () => new Date("2026-10-27T18:45:30.000Z") });

  const result = await repository.saveEvents({ ...identity, events: [event] });

  assert.deepEqual(result, { inserted: 0, saved: 0, duplicateCount: 1 });
  const activitySql = prisma.queries.find((query) => query.sql.includes("INSERT INTO monitor_activity_events")).sql;
  const presenceSql = prisma.queries.find((query) => query.sql.includes("INSERT INTO monitor_device_presence")).sql;
  assert.match(activitySql, /WHERE NOT \(monitor_activity_events\.event_ids @> ARRAY\[EXCLUDED\.id\]/);
  assert.match(activitySql, /active_seconds = CASE[\s\S]*active_seconds \+ EXCLUDED\.active_seconds/);
  assert.match(activitySql, /idle_seconds = CASE[\s\S]*idle_seconds \+ EXCLUDED\.idle_seconds/);
  assert.match(activitySql, /WHEN EXCLUDED\.observed_at >= monitor_activity_events\.observed_at THEN EXCLUDED\.status/);
  assert.match(presenceSql, /120 \* INTERVAL '1 second'/);
  assert.match(presenceSql, /NOW\(\) \+ INTERVAL '1 minute'/);
  assert.match(presenceSql, /monitor_device_presence\.employee_id = EXCLUDED\.employee_id/);
});

test("daily activity date follows the employee timezone and falls back safely", () => {
  const observedAt = "2026-10-27T18:45:00.000Z";
  assert.equal(toDateKeyInTimeZone(observedAt, "Asia/Kolkata"), "2026-10-28");
  assert.equal(toDateKeyInTimeZone(observedAt, "Bad/Timezone"), "2026-10-28");
});
