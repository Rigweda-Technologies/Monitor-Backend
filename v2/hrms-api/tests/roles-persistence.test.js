import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createModels } from '../src/modules/auth/auth.models.js';
import { createAuthRepository } from '../src/modules/auth/auth.repository.js';
import { createRoleService } from '../src/modules/roles/role.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('role CRUD is organization-scoped and role switching persists a new active session', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createModels(connection);
  const ids = { organization: new mongoose.Types.ObjectId(), user: new mongoose.Types.ObjectId() };
  let foreignRoleId;
  t.after(async () => {
    await Promise.all([
      models.Role.deleteMany({ $or: [{ organizationId: ids.organization }, { _id: foreignRoleId }] }),
      models.Permission.deleteMany({ organizationId: ids.organization }),
      models.Organization.deleteMany({ _id: ids.organization }),
      models.User.deleteMany({ _id: ids.user }),
    ]);
    await connection.close();
  });
  const repository = createAuthRepository({ connection });
  const organization = ids.organization;
  const userId = ids.user;
  const permission = await models.Permission.create({ organizationId: organization, name: 'View departments', code: 'DEPT_VIEW', module: 'DEPT' });
  const permissionRows = await repository.permissionsByOrganization(String(organization));
  assert.deepEqual(permissionRows.map(row => row.code), ['DEPT_VIEW']);
  const employee = await models.Role.create({ organizationId: organization, name: 'Employee', slug: 'employee', permissionIds: [permission._id] });
  const target = await models.Role.create({ organizationId: organization, name: 'HR', slug: 'hr', permissionIds: [permission._id] });
  const foreignOrganization = new mongoose.Types.ObjectId();
  const foreignRole = await models.Role.create({ organizationId: foreignOrganization, name: 'Foreign', slug: 'foreign', permissionIds: [] });
  foreignRoleId = foreignRole._id;
  await models.Organization.create({ _id: organization, name: 'Test', code: String(organization), timezone: 'UTC', currency: 'USD' });
  await models.User.create({ _id: userId, email: `role-${userId}@example.test`, password: 'synthetic-hash', organizationIds: [organization], status: 'active' });
  const service = createRoleService({ repository, signToken: () => 'switch-token', config: { tokenListLimit: 10, maxActiveLogins: 1 }, now: () => new Date('2026-11-01T00:00:00.000Z') });
  const created = await service.create({ organizationId: String(organization), name: 'Finance', slug: 'finance', permissionIds: [String(permission._id)] });
  assert.equal(String(created.permissionIds[0]), String(permission._id));
  await assert.rejects(service.getById(String(foreignRole._id), String(organization)), { code: 404 });
  const switched = await service.switchRole({ user: { userId, email: 'user@example.test', organizationId: organization, activeRoleId: String(employee._id), roleIds: [employee._id, target._id] }, body: { roleId: String(target._id) } });
  assert.equal(switched.token, 'switch-token');
  const user = await repository.userById(userId);
  assert.equal(String(user.lastActiveRoleId), String(target._id));
  assert.equal(user.tokenList[0].token, 'switch-token');
  await service.remove(String(created._id), String(organization));
  assert.equal((await service.getById(String(created._id), String(organization))).status, 'inactive');
});
