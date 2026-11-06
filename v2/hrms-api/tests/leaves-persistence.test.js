import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createLeaveModels } from '../src/modules/leaves/leave.models.js';
import { createLeaveBalanceModels } from '../src/modules/leave-balances/leave-balance.models.js';
import { createLeaveService } from '../src/modules/leaves/leave.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('leave application reserves balance and persists the legacy leave document in isolated MongoDB', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = { ...createLeaveBalanceModels(connection), ...createLeaveModels(connection) };
  const organizationId = new mongoose.Types.ObjectId(); const userId = new mongoose.Types.ObjectId();
  const employeeId = new mongoose.Types.ObjectId(); const leaveTypeId = new mongoose.Types.ObjectId();
  t.after(async () => {
    await Promise.all([models.Leave.deleteMany({ organizationId }), models.LeaveBalance.deleteMany({ organizationId }), models.LeaveType.deleteMany({ organizationId }), models.Employee.deleteMany({ organizationId }), models.Organization.deleteMany({ _id: organizationId })]);
    await connection.close();
  });
  await models.Organization.create({ _id: organizationId, name: 'Isolated Leaves Test', code: `LV-${organizationId}`, timezone: 'UTC', currency: 'USD', leaveCycleStartMonth: 1 });
  await models.Employee.create({ _id: employeeId, organizationId, userId, firstName: 'Test', lastName: 'Employee', employmentLifecycleStatus: 'confirmed' });
  await models.LeaveType.create({ _id: leaveTypeId, organizationId, name: 'Annual Leave', code: `AL${String(organizationId).slice(-3)}`, status: 'active' });
  await models.LeaveBalance.create({ organizationId, employeeId, leaveTypeId, cycleStartYear: 2026, total: 5, used: 0, pending: 0, remaining: 5 });
  const service = createLeaveService(models, { resolvePolicy: async () => ({ effectiveDateKeys: ['2026-12-02'] }) });
  const leave = await service.apply({ user: { organizationId, userId }, body: { leaveTypeId, fromDate: '2026-12-02', toDate: '2026-12-02', duration: 'full_day', reason: 'Annual leave' } });
  assert.equal(String(leave.organizationId), String(organizationId));
  assert.equal(String(leave.employeeId), String(employeeId));
  assert.equal(leave.status, 'pending');
  assert.deepEqual(leave.effectiveDateKeys, ['2026-12-02']);
  const balance = await models.LeaveBalance.findOne({ organizationId, employeeId, leaveTypeId, cycleStartYear: 2026 });
  assert.equal(balance.pending, 1);
  assert.equal(balance.remaining, 4);
});
