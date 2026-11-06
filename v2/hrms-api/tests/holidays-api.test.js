import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

test('holiday API preserves four routes, multi-permission listing and response envelopes', async t => {
  const authorized = [];
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false, authService: {}, authenticate: async () => ({ userId: 'u', organizationId: 'o' }), authorize: async permission => { authorized.push(permission); return null; },
    holidayService: { create: async () => ({ _id: 'id' }), list: async () => [], update: async () => ({ name: 'Holiday' }), remove: async () => true }, isReady: async () => {},
  });
  t.after(() => app.close());
  const expected = [['POST','/api/v2/holidays/'],['GET','/api/v2/holidays/'],['PUT','/api/v2/holidays/:id'],['DELETE','/api/v2/holidays/:id']];
  for (const [method,url] of expected) assert.ok(app.applicationRoutes.some(route => route.method === method && route.url === url), `missing ${method} ${url}`);
  const headers = { authorization: 'Bearer token' };
  const create = await app.inject({ method: 'POST', url: '/api/v2/holidays/', headers, payload: { name: 'Founders Day', date: '2026-05-01' } });
  assert.equal(create.statusCode, 201);
  assert.deepEqual(create.json(), { success: true, code: 200, message: 'Founders Day Holiday created', data: null, error: null });
  const list = await app.inject({ url: '/api/v2/holidays/?year=2026', headers });
  assert.deepEqual(list.json(), { success: true, code: 200, message: 'Success', data: [], error: null });
  assert.deepEqual(authorized, ['HOLIDAY_MANAGE',['HOLIDAY_VIEW','LEAVE_VIEW_SELF','LEAVE_APPLY']]);
  await app.ready();
  const paths = app.swagger().paths;
  assert.ok(paths['/api/v2/holidays/'].post.responses['201']);
  assert.ok(paths['/api/v2/holidays/{id}'].delete);
});
