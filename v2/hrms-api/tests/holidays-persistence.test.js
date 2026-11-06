import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createHolidayModels } from '../src/modules/holidays/holiday.models.js';
import { createHolidayService } from '../src/modules/holidays/holiday.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('holiday create records year and audit; list, update and delete preserve organization ownership', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createHolidayModels(connection);
  const organizationId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  t.after(async () => {
    await Promise.all([models.Holiday.deleteMany({ organizationId }), models.AuditLog.deleteMany({ organizationId })]);
    await connection.close();
  });
  const service = createHolidayService(models);
  const request = { user: { userId, organizationId }, body: { name: 'Founders Day', date: '2026-05-01' }, query: { year: '2026' }, params: {}, ip: '127.0.0.1', headers: { 'user-agent': 'v2-test' } };
  const created = await service.create(request);
  assert.equal(created.year, 2026);
  assert.equal((await models.AuditLog.countDocuments({ organizationId, action: 'CREATE' })), 1);
  assert.equal((await service.list(request)).length, 1);
  request.body = { date: '2027-05-01' };
  const updated = await service.update(String(created._id), request);
  assert.equal(updated.year, 2026);
  await service.remove(String(created._id), request);
  assert.equal((await service.list(request)).length, 0);
});
