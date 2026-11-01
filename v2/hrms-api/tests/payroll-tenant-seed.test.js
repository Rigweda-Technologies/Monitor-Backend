import test from 'node:test';
import assert from 'node:assert/strict';
import { createPayrollTenantSeedService } from '../src/modules/payroll/payroll-tenant-seed.service.js';
import { createPayrollTenantSeedRepository } from '../src/modules/payroll/payroll-tenant-seed.repository.js';

const orgs = [
  { _id: 'org-1', name: 'Acme', code: 'ACME', timezone: 'Asia/Kolkata', currency: 'USD' },
  { _id: 'org-2', name: 'Beta', code: 'BETA', timezone: '', currency: 'INR' },
];
const model = () => ({
  find: filter => ({ select: fields => ({ lean: async () => {
    assert.equal(fields, '_id name code timezone currency');
    return filter?._id ? orgs.filter(org => org._id === filter._id) : orgs;
  } }) }),
});

test('payroll tenant synchronization dry-run lists organizations without PostgreSQL writes', async () => {
  const calls = [];
  const sync = createPayrollTenantSeedService({ Organization: model(), upsertOrganizationTenant: async org => calls.push(org) });
  assert.deepEqual(await sync(), {
    mode: 'dry-run', organizationCount: 2,
    organizations: [{ organizationId: 'org-1', name: 'Acme', code: 'ACME' }, { organizationId: 'org-2', name: 'Beta', code: 'BETA' }],
  });
  assert.deepEqual(calls, []);
});

test('payroll tenant synchronization applies sequentially and supports targeting', async () => {
  const calls = [];
  const sync = createPayrollTenantSeedService({ Organization: model(), upsertOrganizationTenant: async org => {
    calls.push(org._id);
    return { id: `tenant-${org._id}`, organization_id: org._id, legal_name: org.name };
  } });
  assert.deepEqual(await sync({ apply: true, organizationId: 'org-2' }), {
    mode: 'applied', organizationCount: 1, tenants: [{ id: 'tenant-org-2', organization_id: 'org-2', legal_name: 'Beta' }],
  });
  assert.deepEqual(calls, ['org-2']);
});

test('payroll tenant synchronization reports the committed count if a later organization fails', async () => {
  const calls = [];
  const sync = createPayrollTenantSeedService({ Organization: model(), upsertOrganizationTenant: async org => {
    calls.push(org._id);
    if (org._id === 'org-2') throw new Error('database detail must stay private');
    return { organization_id: org._id };
  } });
  await assert.rejects(sync({ apply: true }), error => error.completedCount === 1 && /1 successful organization/.test(error.message) && !error.message.includes('database detail'));
  assert.deepEqual(calls, ['org-1', 'org-2']);
});

test('payroll tenant Prisma repository binds V1 upsert values and defaults', async () => {
  const calls = [];
  const prisma = { $queryRawUnsafe: async (...args) => { calls.push(args); return [{ id: 'tenant-id', organization_id: args[1], legal_name: args[2] }]; } };
  const repository = createPayrollTenantSeedRepository({ prisma });
  const row = await repository.upsertOrganizationTenant({ _id: 'org-id', name: 'Acme', code: 'ACME', timezone: '' });
  assert.deepEqual(row, { id: 'tenant-id', organization_id: 'org-id', legal_name: 'Acme' });
  assert.match(calls[0][0], /ON CONFLICT \(organization_id\)/);
  assert.deepEqual(calls[0].slice(1), ['org-id', 'Acme', 'ACME', 'Asia/Kolkata', 'INR']);
});

test('payroll tenant Prisma repository preserves V1 fallbacks and requires an ID', async () => {
  const calls = [];
  const repository = createPayrollTenantSeedRepository({ prisma: { $queryRawUnsafe: async (...args) => {
    calls.push(args);
    return [{ id: 'tenant-id', organization_id: 'org-id', legal_name: 'Organization' }];
  } } });
  await repository.upsertOrganizationTenant({ _id: 'org-id' });
  assert.deepEqual(calls[0].slice(1), ['org-id', 'Organization', 'Organization', 'Asia/Kolkata', 'INR']);
  await assert.rejects(repository.upsertOrganizationTenant({ name: 'No ID' }), /Organization ID is required/);
});
