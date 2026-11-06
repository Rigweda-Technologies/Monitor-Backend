import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createShiftModels } from '../src/modules/shifts/shift.models.js';
import { createShiftService } from '../src/modules/shifts/shift.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('shift CRUD and employee shift lookup retain organization-scoped results', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createShiftModels(connection);
  const organizationId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  t.after(async () => {
    await Promise.all([models.Shift.deleteMany({ organizationId }), models.Employee.deleteMany({ userId, organizationId })]);
    await connection.close();
  });
  const service = createShiftService(models);
  const request = { user: { organizationId, userId }, body: { name: 'Day Shift', code: 'day', startTime: '09:00', endTime: '17:00', graceMinutes: 10 }, params: {}, query: {} };
  const created = await service.create(request);
  assert.equal(created.code, 'DAY');
  await models.Employee.create({ userId, organizationId, shiftId: created._id });
  assert.equal(String((await service.myShift(request))._id), String(created._id));
  request.params = { id: String(created._id) };
  request.body = { status: 'inactive' };
  assert.equal((await service.update(request)).status, 'inactive');
  assert.equal((await service.remove(request)).status, 'inactive');
});
