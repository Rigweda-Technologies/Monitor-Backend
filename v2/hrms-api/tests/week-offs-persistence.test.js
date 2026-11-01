import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createWeekOffModels } from '../src/modules/week-offs/week-off.models.js';
import { createWeekOffService } from '../src/modules/week-offs/week-off.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('week-off upserts, shift population and fallback resolvers preserve legacy behavior', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createWeekOffModels(connection);
  const organizationId = new mongoose.Types.ObjectId();
  const shift = await models.Shift.create({ organizationId, name: 'Day Shift', code: `D${String(organizationId).slice(-3)}`, startTime: '09:00', endTime: '17:00' });
  t.after(async () => {
    await Promise.all([models.WeekOff.deleteMany({ organizationId }), models.Shift.deleteMany({ organizationId })]);
    await connection.close();
  });
  const service = createWeekOffService(models);
  const request = { user: { organizationId }, body: { shiftId: null, weekOffDays: [0,6] }, query: {}, params: {} };
  await service.upsert(request);
  request.body = { shiftId: String(shift._id), weekOffDays: [0] };
  await service.upsert(request);
  assert.deepEqual(await service.resolveWeekOffDays({ organizationId, shiftId: shift._id }), [0]);
  assert.deepEqual(await service.resolveWeekOffDays({ organizationId, shiftId: new mongoose.Types.ObjectId() }), [0,6]);
  const resolved = await service.resolveWeekOffMapForEmployees({ organizationId, employees: [{ _id: 'one', shiftId: shift._id }, { _id: 'two', shiftId: null }] });
  assert.deepEqual(resolved.employeeMap.get('one'), [0]);
  assert.deepEqual(resolved.employeeMap.get('two'), [0,6]);
  const all = await service.getAll(request);
  assert.equal(all.find(row => row.shiftId)?.shiftId.name, 'Day Shift');
});
