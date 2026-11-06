import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

test('week-off API exposes three documented routes and the v1 response shape', async t => {
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false, authService: {}, authenticate: async () => ({ userId: 'u', organizationId: 'o' }), authorize: async () => null,
    weekOffService: { upsert: async request => ({ weekOffDays: request.body.weekOffDays }), get: async () => null, getAll: async () => [] }, isReady: async () => {},
  });
  t.after(() => app.close());
  const expected = [['POST','/api/v2/week-offs/'],['GET','/api/v2/week-offs/'],['GET','/api/v2/week-offs/all']];
  for (const [method,url] of expected) assert.ok(app.applicationRoutes.some(route => route.method === method && route.url === url), `missing ${method} ${url}`);
  const response = await app.inject({ method: 'POST', url: '/api/v2/week-offs/', payload: { shiftId: null, weekOffDays: [0,6] }, headers: { authorization: 'Bearer token' } });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { success: true, code: 200, message: 'Week off configuration saved', data: { weekOffDays: [0,6] }, error: null });
  await app.ready();
  const paths = app.swagger().paths;
  assert.ok(paths['/api/v2/week-offs/'].post.responses['200']);
  assert.ok(paths['/api/v2/week-offs/all'].get);
});
