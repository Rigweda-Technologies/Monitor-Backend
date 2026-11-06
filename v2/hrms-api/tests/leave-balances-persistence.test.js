import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createLeaveBalanceModels } from '../src/modules/leave-balances/leave-balance.models.js';
import { createLeaveBalanceService } from '../src/modules/leave-balances/leave-balance.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('carry-forward retry marker is excluded from public leave-balance projections', async () => {
  const connection=mongoose.createConnection();
  try {
    const models=createLeaveBalanceModels(connection);
    assert.equal(models.LeaveBalance.schema.path('carryForwardedFromCycleYears').options.select,false);
  } finally { await connection.close(); }
});

test('leave-balance lookup and adjustment preserve tenant ownership, half-day normalization and audit history', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createLeaveBalanceModels(connection); const organizationId = new mongoose.Types.ObjectId(); const userId = new mongoose.Types.ObjectId(); const employeeId = new mongoose.Types.ObjectId();
  t.after(async () => { await Promise.all([models.LeaveBalance.deleteMany({ organizationId }), models.LeaveType.deleteMany({ organizationId }), models.Employee.deleteMany({ organizationId }), models.AuditLog.deleteMany({ organizationId })]); await connection.close(); });
  const leaveType = await models.LeaveType.create({ organizationId, name: 'Annual Leave', code: 'AL', status: 'active' });
  await models.Employee.collection.insertOne({ _id: employeeId, organizationId, userId, firstName: 'Test', lastName: 'Employee', employeeCode: 'EMP-1' });
  const balance = await models.LeaveBalance.create({ organizationId, employeeId, leaveTypeId: leaveType._id, cycleStartYear: 2026, total: 8.3, used: 1.1, pending: 0.4, remaining: 6.8 });
  const service = createLeaveBalanceService(models); const request = { user: { organizationId, userId }, params: {}, body: {}, query: {}, headers: { 'user-agent': 'isolated-test' }, ip: '127.0.0.1' };
  const own = await service.getMy(request);
  assert.equal(own[0].total, 8.5); assert.equal(own[0].used, 1); assert.equal(own[0].remaining, 7);
  request.params.employeeId = String(employeeId); request.body = { leaveTypeId: String(leaveType._id), days: 6 };
  const adjusted = await service.adjustEmployee(request);
  assert.equal(adjusted.balance.total, 6); assert.equal(adjusted.balance.remaining, 4.5); assert.equal(adjusted.employee.employeeCode, 'EMP-1');
  assert.equal(await models.AuditLog.countDocuments({ organizationId, module: 'leave_balances', action: 'UPDATE' }), 1);
  await assert.rejects(service.adjustEmployee({ ...request, body: { leaveTypeId: String(leaveType._id), days: 1 } }), /less than used \+ pending/);
  assert.equal(String((await models.LeaveBalance.findById(balance._id)).total), '6');
});
