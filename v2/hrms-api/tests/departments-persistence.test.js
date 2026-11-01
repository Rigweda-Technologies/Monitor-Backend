import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createDepartmentModels } from '../src/modules/departments/department.models.js';
import { createDepartmentService } from '../src/modules/departments/department.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('department operations preserve organization scope, status projection and audit writes', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createDepartmentModels(connection);
  const ids = { organization: new mongoose.Types.ObjectId(), user: new mongoose.Types.ObjectId() };
  const service = createDepartmentService({ models });
  const request = { user: { userId: ids.user, organizationId: ids.organization }, body: { name: 'Operations', code: 'ops' }, params: {}, query: {}, ip: '127.0.0.1', headers: { 'user-agent': 'v2-test' } };
  t.after(async () => {
    await models.Department.deleteMany({ organizationId: ids.organization });
    await models.AuditLog.deleteMany({ organizationId: ids.organization });
    await connection.close();
  });
  const created = await service.create(request);
  assert.equal(created.code, 'OPS');
  assert.equal(String(created.organizationId), String(ids.organization));
  assert.equal(await models.AuditLog.countDocuments({ organizationId: ids.organization, action: 'CREATE' }), 1);
  request.params = { id: String(created._id) };
  request.body = { status: 'inactive' };
  const updated = await service.update(request);
  assert.equal(updated.status, 'inactive');
  const fetched = await service.getById(request);
  assert.equal(fetched.status, 'inactive');
  assert.equal((await service.list(request)).length, 0);
});
