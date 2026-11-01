import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrganizationSeeder } from '../src/modules/roles/organization-seeder.js';

test('organization seeding creates the default roles and preserves the v1 permission rules', async () => {
  const roles = [];
  const permissions = [];
  const Role = {
    findOne: async filter => roles.find(role => String(role.organizationId) === String(filter.organizationId) && role.slug === filter.slug) || null,
    create: async value => { const role = { ...value, save: async () => {} }; roles.push(role); return role; },
    find: async filter => roles.filter(role => String(role.organizationId) === String(filter.organizationId)),
  };
  const Permission = {
    findOne: async filter => permissions.find(permission => String(permission.organizationId) === String(filter.organizationId) && permission.code === filter.code) || null,
    create: async value => { const permission = { ...value, _id:`permission-${permissions.length + 1}` }; permissions.push(permission); return permission; },
    find: async filter => permissions.filter(permission => String(permission.organizationId) === String(filter.organizationId)),
  };
  const seed = createOrganizationSeeder({ Role, Permission });

  await seed('org-1');

  assert.deepEqual(roles.map(role => role.slug), ['org-admin','hr','manager','employee']);
  assert.ok(permissions.some(permission => permission.code === '*'));
  const employee = roles.find(role => role.slug === 'employee');
  const employeeCodes = permissions.filter(permission => employee.permissionIds.includes(permission._id)).map(permission => permission.code);
  assert.ok(employeeCodes.includes('LEAVE_APPLY'));
  assert.ok(!employeeCodes.includes('PAYROLL_RUN_VIEW'));
  assert.equal(roles.find(role => role.slug === 'manager').permissionIds.length > 0, true);
});
