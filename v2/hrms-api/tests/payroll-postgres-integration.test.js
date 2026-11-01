import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connectPrismaClients } from '../src/database/prisma.js';
import { loadConfig } from '../src/config/env.js';
import { createPayrollRepository } from '../src/modules/payroll/payroll.repository.js';
import { createOrganizationPayrollRepository } from '../src/modules/organizations/organization-payroll.repository.js';
import { createPayrollTenantSeedRepository } from '../src/modules/payroll/payroll-tenant-seed.repository.js';
import { applyV1PayrollMigrations } from './helpers/apply-v1-payroll-migrations.js';

const databaseUrl = process.env.V2_HRMS_ISOLATED_PAYROLL_TEST_DATABASE_URL;

test('payroll Prisma queries and business transaction work against the migrated isolated PostgreSQL schema', { skip: !databaseUrl }, async t => {
  const parsed = new URL(databaseUrl);
  assert.match(parsed.pathname, /[_-](test|isolated|ci)([_-]|$)/i, 'payroll integration database must be explicitly isolated');
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(parsed.hostname), 'payroll integration database must be local');
  const config = loadConfig({
    MONGODB_URI: 'mongodb://127.0.0.1:27017/hrms_v2_isolated_test',
    JWT_SECRET: 'payroll-postgres-integration-test-secret-0123456789',
    PAYROLL_DB_ENABLED: 'true',
    PAYROLL_DATABASE_URL: databaseUrl,
  });
  const clients = await connectPrismaClients(config.postgres);
  const prisma = clients.payroll;
  await applyV1PayrollMigrations(prisma);
  const repository = createPayrollRepository({ prisma });
  const organizationPayroll = createOrganizationPayrollRepository({ prisma, enabled: true });
  const tenantSeedRepository = createPayrollTenantSeedRepository({ prisma });
  const organizationId = `v2-test-${randomUUID()}`;
  const seedOrganizationId = `v2-seed-${randomUUID()}`;
  t.after(async () => {
    await organizationPayroll.deleteTenantForOrganization(organizationId).catch(() => {});
    await organizationPayroll.deleteTenantForOrganization(seedOrganizationId).catch(() => {});
    await clients.close();
  });

  const seededTenant = await tenantSeedRepository.upsertOrganizationTenant({ _id: seedOrganizationId, name: 'Seed Organization', code: 'SEED', timezone: 'Asia/Kolkata', currency: 'USD' });
  assert.equal(seededTenant.organization_id, seedOrganizationId);
  assert.equal(seededTenant.legal_name, 'Seed Organization');
  const updatedTenant = await tenantSeedRepository.upsertOrganizationTenant({ _id: seedOrganizationId, name: 'Renamed Seed', code: 'SEED-2', timezone: 'UTC', currency: 'EUR' });
  assert.equal(updatedTenant.id, seededTenant.id);
  assert.equal(updatedTenant.legal_name, 'Renamed Seed');
  const tenantFields = await repository.query('SELECT country_code,state_code,timezone,currency_code,is_active,created_by,updated_by FROM payroll_tenants WHERE organization_id = $1', [seedOrganizationId]);
  assert.deepEqual(tenantFields.rows[0], { country_code: 'IN', state_code: 'TS', timezone: 'UTC', currency_code: 'INR', is_active: true, created_by: 'system', updated_by: 'system' });

  await assert.rejects(repository.transaction(async transaction => {
    await transaction.execute(
      'INSERT INTO payroll_tenants (organization_id, legal_name) VALUES ($1, $2)',
      [organizationId, 'Rollback Fixture'],
    );
    throw new Error('rollback fixture');
  }), /rollback fixture/);
  assert.equal((await repository.query('SELECT id FROM payroll_tenants WHERE organization_id = $1', [organizationId])).rows.length, 0);

  const committed = await repository.transaction(async transaction => {
    const inserted = await transaction.query(
      'INSERT INTO payroll_tenants (organization_id, legal_name) VALUES ($1, $2) RETURNING id, organization_id, legal_name',
      [organizationId, 'Committed Fixture'],
    );
    const tenantId = inserted.rows[0].id;
    const group = await transaction.query(
      'INSERT INTO pay_groups (tenant_id, code, name, pay_frequency, salary_pay_day) VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, code',
      [tenantId, 'V2-TEST', 'V2 Isolated Test', 'monthly', 30],
    );
    return { tenant: inserted.rows[0], payGroup: group.rows[0] };
  });
  assert.equal(committed.tenant.organization_id, organizationId);
  assert.equal(committed.payGroup.tenant_id, committed.tenant.id);

  const cleared = await organizationPayroll.clearOrganization({ organizationId, tables: ['pay_groups'] });
  assert.equal(cleared.payrollTenantFound, true);
  assert.equal(cleared.clearedTables.pay_groups, 1);
  assert.equal((await repository.query('SELECT id FROM pay_groups WHERE tenant_id = $1', [committed.tenant.id])).rows.length, 0);
  assert.equal((await organizationPayroll.deleteTenantForOrganization(organizationId)).payrollTenantDeleted, 1);
});
