import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createDesignationModels } from '../src/modules/designations/designation.models.js';
import { createDesignationService } from '../src/modules/designations/designation.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('designation operations enforce active department ownership and write audit history', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createDesignationModels(connection);
  const ids = { organization: new mongoose.Types.ObjectId(), user: new mongoose.Types.ObjectId() };
  t.after(async () => {
    await models.Designation.deleteMany({ organizationId: ids.organization });
    await models.Department.deleteMany({ organizationId: ids.organization });
    await models.AuditLog.deleteMany({ organizationId: ids.organization });
    await connection.close();
  });
  const department = await models.Department.create({ organizationId: ids.organization, name: 'Engineering', code: `ENG${String(ids.organization).slice(-4)}` });
  const service = createDesignationService(models);
  const request = { user: { userId: ids.user, organizationId: ids.organization }, body: { name: 'Senior Engineer', level: 3, departmentId: String(department._id) }, params: {}, query: {}, ip: '127.0.0.1', headers: { 'user-agent': 'v2-test' } };
  const created = await service.create(request);
  assert.equal(String(created.departmentId), String(department._id));
  request.params = { id: String(created._id) };
  request.body = { departmentId: String(department._id), status: 'inactive' };
  const updated = await service.update(request);
  assert.equal(updated.departmentName, 'Engineering');
  assert.equal(updated.status, 'inactive');
  request.body = {};
  request.query = { includeInactive: 'true' };
  assert.equal((await service.list(request)).length, 1);
  assert.equal(await models.AuditLog.countDocuments({ organizationId: ids.organization }), 2);
  await models.Department.updateOne({ _id: department._id }, { $set: { status: 'inactive' } });
  await assert.rejects(service.create({ ...request, body: { name: 'Manager', departmentId: String(department._id) } }), { code: 400 });
});
