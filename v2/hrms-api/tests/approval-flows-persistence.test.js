import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApprovalFlowModels } from '../src/modules/approval-flows/approval-flow.models.js';
import { createApprovalFlowService } from '../src/modules/approval-flows/approval-flow.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('approval flows validate approvers and overlapping ranges, populate employees, update and deactivate', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createApprovalFlowModels(connection);
  const organizationId = new mongoose.Types.ObjectId(); const foreignOrganizationId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  t.after(async () => {
    await models.ApprovalFlow.deleteMany({ organizationId });
    await models.Employee.deleteMany({ organizationId });
    await models.Role.deleteMany({ organizationId });
    await connection.close();
  });
  const role = await models.Role.create({ organizationId, name: 'HR', slug: 'hr' });
  const employeeId = new mongoose.Types.ObjectId();
  await models.Employee.collection.insertOne({ _id: employeeId, organizationId, userId, status: 'active', firstName: 'Test', lastName: 'Approver', employeeCode: 'AP-1' });
  const service = createApprovalFlowService(models);
  const request = { user: { organizationId }, body: { moduleKey: 'leave', name: 'Leave Approval', minDays: 0, maxDays: 3, steps: [{ stepNumber: 2, approverType: 'employee', employeeId: String(employeeId) }, { stepNumber: 1, approverType: 'role', roleSlug: 'hr' }] }, query: {}, params: {}, headers: {} };
  const created = await service.create(request);
  assert.deepEqual(created.steps.map(step => step.stepNumber), [1, 2]);
  assert.equal(String(created.organizationId), String(organizationId));
  await assert.rejects(service.create({ ...request, body: { ...request.body, name: 'Overlapping Flow', minDays: 3, maxDays: 5 } }), /overlaps/);
  await assert.rejects(service.create({ ...request, body: { ...request.body, name: 'Invalid Approver', minDays: 4, maxDays: 5, steps: [{ stepNumber: 1, approverType: 'role', roleSlug: 'missing' }] } }), /role approvers are invalid/);
  const listed = await service.list({ ...request, query: { moduleKey: 'leave' } });
  assert.equal(listed.length, 1);
  assert.equal(listed[0].steps[1].employeeId.firstName, 'Test');
  const updated = await service.update({ ...request, params: { id: String(created._id) }, body: { maxDays: 2, name: 'Updated Approval' } });
  assert.equal(updated.name, 'Updated Approval');
  await service.remove({ ...request, params: { id: String(created._id) } });
  assert.equal((await models.ApprovalFlow.findById(created._id)).isActive, false);
  await assert.rejects(service.remove({ ...request, params: { id: new mongoose.Types.ObjectId() } }), /not found/);
  assert.ok(role._id);
});
