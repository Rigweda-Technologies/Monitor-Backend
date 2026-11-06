import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createLeaveTypeModels } from '../src/modules/leave-types/leave-type.models.js';
import { createLeaveTypeService } from '../src/modules/leave-types/leave-type.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('creating a leave type initializes employee balances with legacy cycle settings', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createLeaveTypeModels(connection);
  const organizationId = new mongoose.Types.ObjectId();
  const employeeId = new mongoose.Types.ObjectId();
  t.after(async () => {
    await Promise.all([
      models.LeaveBalance.deleteMany({ organizationId }), models.LeaveType.deleteMany({ organizationId }),
      models.Employee.deleteMany({ _id: employeeId }), models.Settings.deleteMany({ organizationId }), models.Organization.deleteMany({ _id: organizationId }),
    ]);
    await connection.close();
  });
  await models.Organization.create({ _id: organizationId, name: 'Test Org', code: String(organizationId), timezone: 'UTC', currency: 'USD', leaveCycleStartMonth: 1 });
  await models.Settings.create({ organizationId, leaveCreditFrequency: 'yearly', leaveTypeCreditMode: 'full_year' });
  await models.Employee.create({ _id: employeeId, userId: new mongoose.Types.ObjectId(), organizationId, dateOfJoining: new Date('2020-01-01'), isDeleted: false });
  const service = createLeaveTypeService(models);
  const leaveType = await service.create({ user: { organizationId }, body: { name: 'Annual Leave', code: 'AL', daysPerYear: 18, isCarryForward: false } });
  const balance = await models.LeaveBalance.findOne({ organizationId, employeeId, leaveTypeId: leaveType._id });
  assert.equal(balance.total, 18);
  assert.equal(balance.remaining, 18);
  assert.equal(balance.used, 0);
  await service.remove({ params: { id: String(leaveType._id) }, user: { organizationId } });
  assert.equal((await models.LeaveType.findById(leaveType._id)).status, 'inactive');
});
