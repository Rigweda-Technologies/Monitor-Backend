import test from "node:test";
import assert from "node:assert/strict";
import { DeviceOwnershipConflictError } from "../src/errors.js";
import { createBrowserHistoryRepository } from "../src/modules/browser-history/browser-history.repository.js";

const input = {
  organizationId: "org-1",
  employeeId: "employee-1",
  employeeName: "Test Person",
  deviceId: "device-1",
  entries: [{ entryId: "hash-1", observedAt: new Date("2026-10-27T10:00:00.000Z"), browser: "chrome", url: "https://example.test", title: "", activeWindowTitle: null, durationMs: 0 }],
};

const createPrismaMock = ({ conflictingOwner = false, insertResponses = [[{ entry_id: "hash-1" }]] } = {}) => {
  const queries = [];
  const transaction = {
    $queryRaw: async (query) => {
      queries.push(query.sql);
      if (query.sql.includes("SELECT 1 AS conflict")) return conflictingOwner ? [{ conflict: 1 }] : [];
      if (query.sql.includes("INSERT INTO monitor_browser_history")) return insertResponses.shift() || [];
      return [];
    },
  };
  let transactionCount = 0;
  const prisma = {
    $transaction: async (callback) => {
      transactionCount += 1;
      return callback(transaction);
    },
  };
  return { prisma, queries, get transactionCount() { return transactionCount; } };
};

test("browser history repository writes transactionally and counts new versus duplicate entries", async () => {
  const mock = createPrismaMock({ insertResponses: [[{ entry_id: "hash-1" }], []] });
  const repository = createBrowserHistoryRepository({ prisma: mock.prisma });
  const result = await repository.saveEntries({ ...input, entries: [...input.entries, { ...input.entries[0], entryId: "hash-2" }] });

  assert.deepEqual(result, { inserted: 1, duplicateCount: 1 });
  assert.equal(mock.transactionCount, 1);
  assert.ok(mock.queries.some((query) => query.includes("pg_advisory_xact_lock")));
  assert.ok(mock.queries.some((query) => query.includes("ON CONFLICT (device_id, entry_id) DO NOTHING")));
});

test("browser history owner conflict aborts before inserting any event", async () => {
  const mock = createPrismaMock({ conflictingOwner: true });
  const repository = createBrowserHistoryRepository({ prisma: mock.prisma });
  await assert.rejects(repository.saveEntries(input), DeviceOwnershipConflictError);
  assert.equal(mock.transactionCount, 1);
  assert.equal(mock.queries.some((query) => query.includes("INSERT INTO monitor_browser_history")), false);
});
