import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { loadConfig } from "../src/config/env.js";
import { createPrismaClient } from "../src/database/prisma.js";
import { DeviceOwnershipConflictError } from "../src/errors.js";
import { createBrowserHistoryRepository } from "../src/modules/browser-history/browser-history.repository.js";

const isolatedDatabaseUrl = process.env.V2_MONITOR_ISOLATED_TEST_DATABASE_URL;

test("browser history mappings preserve idempotency and reject foreign device owners in isolated PostgreSQL", {
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
  const repository = createBrowserHistoryRepository({ prisma });
  const suffix = randomUUID();
  const deviceId = `v2-history-test-device-${suffix}`;
  const entry = {
    entryId: `v2-history-test-entry-${suffix}`,
    observedAt: new Date("2026-10-27T10:00:00.000Z"),
    browser: "chrome",
    url: "https://example.test/test-fixture",
    title: "Synthetic fixture",
    activeWindowTitle: null,
    durationMs: 1000,
  };

  try {
    await prisma.$connect();
    const first = await repository.saveEntries({
      organizationId: `v2-history-test-org-${suffix}`,
      employeeId: `v2-history-test-employee-${suffix}`,
      employeeName: "Synthetic Test User",
      deviceId,
      entries: [entry],
    });
    assert.deepEqual(first, { inserted: 1, duplicateCount: 0 });

    const duplicate = await repository.saveEntries({
      organizationId: `v2-history-test-org-${suffix}`,
      employeeId: `v2-history-test-employee-${suffix}`,
      employeeName: "Synthetic Test User",
      deviceId,
      entries: [entry],
    });
    assert.deepEqual(duplicate, { inserted: 0, duplicateCount: 1 });

    await assert.rejects(repository.saveEntries({
      organizationId: `v2-history-other-org-${suffix}`,
      employeeId: `v2-history-other-employee-${suffix}`,
      employeeName: "Synthetic Other User",
      deviceId,
      entries: [{ ...entry, entryId: `v2-history-foreign-entry-${suffix}` }],
    }), DeviceOwnershipConflictError);

    const rows = await prisma.$queryRaw(Prisma.sql`
      SELECT entry_id FROM monitor_browser_history WHERE device_id = ${deviceId}
    `);
    assert.equal(rows.length, 1);
  } finally {
    await prisma.$executeRaw(Prisma.sql`DELETE FROM monitor_browser_history WHERE device_id = ${deviceId}`);
    await prisma.$disconnect();
  }
});
