import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

test('shift API exposes five operations and preserves response envelopes', async t => {
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false, authService: {}, authenticate: async () => ({ userId: 'u', organizationId: 'o' }), authorize: async () => null,
    shiftService: { create: async request => ({ name: request.body.name }), list: async () => [], myShift: async () => null, update: async () => ({}), remove: async () => ({ status: 'inactive' }) }, isReady: async () => {},
  });
  t.after(() => app.close());
  const expected = [['POST','/api/v2/shifts/'],['GET','/api/v2/shifts/'],['GET','/api/v2/shifts/my'],['PUT','/api/v2/shifts/:id'],['DELETE','/api/v2/shifts/:id']];
  for (const [method,url] of expected) assert.ok(app.applicationRoutes.some(route => route.method === method && route.url === url), `missing ${method} ${url}`);
  const created = await app.inject({ method: 'POST', url: '/api/v2/shifts/', payload: { name: 'Day Shift', code: 'day', startTime: '09:00', endTime: '17:00' }, headers: { authorization: 'Bearer token' } });
  assert.equal(created.statusCode, 201);
  assert.deepEqual(created.json(), { success: true, code: 200, message: 'Shift created', data: { name: 'Day Shift' }, error: null });
  await app.ready();
  assert.ok(app.swagger().paths['/api/v2/shifts/my'].get);
  assert.ok(app.swagger().paths['/api/v2/shifts/{id}'].delete);
});
