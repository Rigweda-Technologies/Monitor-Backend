import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { loadConfig } from "../src/config/env.js";
import { createPrismaClient } from "../src/database/prisma.js";
import { createActivityRepository } from "../src/modules/activity/activity.repository.js";
import { DeviceOwnershipConflictError } from "../src/errors.js";

const isolatedDatabaseUrl = process.env.V2_MONITOR_ISOLATED_TEST_DATABASE_URL;

test("activity ingestion preserves transaction, dedupe and device ownership against isolated PostgreSQL", {
  skip: !isolatedDatabaseUrl,
}, async () => {
  const databaseUrl = new URL(isolatedDatabaseUrl);
  const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ""));
  assert.match(databaseName, /(^|[-_])(test|testing|isolated|ci)([-_]|$)/i,
    "V2_MONITOR_ISOLATED_TEST_DATABASE_URL must target a database explicitly named test/isolated/ci");

  const config = loadConfig({
    DATABASE_URL: isolatedDatabaseUrl,
    HRMS_BACKEND_URL: "http://127.0.0.1:8000",
    DATABASE_SSL: process.env.V2_MONITOR_TEST_DATABASE_SSL || "false",
  });
  const prisma = createPrismaClient(config);
  const repository = createActivityRepository({ prisma });
  const suffix = randomUUID();
  const organizationId = `v2-test-org-${suffix}`;
  const employeeId = `v2-test-employee-${suffix}`;
  const deviceId = `v2-test-device-${suffix}`;
  const firstEventId = `v2-test-event-a-${suffix}`;
  const secondEventId = `v2-test-event-b-${suffix}`;
  const foreignEventId = `v2-test-event-foreign-${suffix}`;
  const dailyKey = `${organizationId}:${employeeId}:2026-10-27`;

  try {
    await prisma.$connect();
    const result = await repository.saveEvents({
      organizationId,
      employeeId,
      employeeName: "Synthetic Test User",
      activityTimeZone: "Asia/Kolkata",
      events: [
        { eventId: firstEventId, deviceId, observedAt: new Date("2026-10-27T10:00:00.000Z"), status: "active", activeSeconds: 30, idleSeconds: 0 },
        { eventId: secondEventId, deviceId, observedAt: new Date("2026-10-27T09:00:00.000Z"), status: "idle", activeSeconds: 0, idleSeconds: 10 },
      ],
    });
    assert.deepEqual(result, { inserted: 2, saved: 2, duplicateCount: 0 });

    const duplicate = await repository.saveEvents({
      organizationId,
      employeeId,
      employeeName: "Synthetic Test User",
      activityTimeZone: "Asia/Kolkata",
      events: [{ eventId: firstEventId, deviceId, observedAt: new Date("2026-10-27T10:00:00.000Z"), status: "active", activeSeconds: 30, idleSeconds: 0 }],
    });
    assert.deepEqual(duplicate, { inserted: 0, saved: 0, duplicateCount: 1 });

    const rows = await prisma.$queryRaw(Prisma.sql`
      SELECT status, active_seconds, idle_seconds, event_ids
      FROM monitor_activity_events
      WHERE daily_key = ${dailyKey}
    `);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "active");
    assert.equal(rows[0].active_seconds, 30);
    assert.equal(rows[0].idle_seconds, 10);
    assert.equal(rows[0].event_ids.length, 2);

    await assert.rejects(repository.saveEvents({
      organizationId: `v2-test-other-org-${suffix}`,
      employeeId: `v2-test-other-employee-${suffix}`,
      employeeName: "Synthetic Other User",
      activityTimeZone: "Asia/Kolkata",
      events: [{ eventId: foreignEventId, deviceId, observedAt: new Date("2026-10-27T11:00:00.000Z"), status: "active", activeSeconds: 1, idleSeconds: 0 }],
    }), DeviceOwnershipConflictError);

    const rolledBackRows = await prisma.$queryRaw(Prisma.sql`
      SELECT id FROM monitor_activity_events WHERE id = ${foreignEventId}
    `);
    assert.equal(rolledBackRows.length, 0);
  } finally {
    await prisma.$executeRaw(Prisma.sql`DELETE FROM monitor_activity_events WHERE id IN (${firstEventId}, ${secondEventId}, ${foreignEventId})`);
    await prisma.$executeRaw(Prisma.sql`DELETE FROM monitor_device_presence WHERE device_id = ${deviceId}`);
    await prisma.$disconnect();
  }
});
