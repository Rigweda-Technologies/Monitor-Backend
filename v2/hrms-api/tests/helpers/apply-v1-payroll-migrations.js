import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const migrationsPath = path.join(repoRoot, 'hrms/back-end/src/payroll/migrations');

export const applyV1PayrollMigrations = async prisma => prisma.$transaction(async transaction => {
  // Keep the shared isolated test schema deterministic when node:test launches
  // the payroll integration files concurrently.
  await transaction.$queryRawUnsafe("SELECT 'locked'::text AS acquired FROM (SELECT pg_advisory_xact_lock(734201, 18)) AS migration_lock");
  const [state] = await transaction.$queryRawUnsafe("SELECT to_regclass('public.payroll_tenants')::text AS table_name");
  if (state?.table_name) {
    const [latest] = await transaction.$queryRawUnsafe("SELECT to_regclass('public.payroll_action_idempotency')::text AS table_name");
    assert.ok(latest?.table_name, 'existing isolated payroll DB must already include the current V1 schema migrations');
    return 'already-current';
  }

  const names = (await readdir(migrationsPath)).filter(name => /^\d+_.*\.js$/.test(name)).sort();
  assert.equal(names.length, 11, 'expected all eleven existing V1 payroll migrations');
  for (const name of names) {
    const migration = require(path.join(migrationsPath, name));
    for (const statement of migration.up) await transaction.$executeRawUnsafe(statement);
  }
  return 'applied-current';
}, { maxWait: 10000, timeout: 120000 });
