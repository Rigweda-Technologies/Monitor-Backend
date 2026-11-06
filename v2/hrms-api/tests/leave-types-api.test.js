import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

test('leave type API preserves four routes, validation, envelopes and OpenAPI', async t => {
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false, authService: {}, authenticate: async () => ({ userId: 'u', organizationId: 'o' }), authorize: async () => null,
    leaveTypeService: { create: async request => ({ name: request.body.name, code: request.body.code }), list: async () => [], update: async () => ({}), remove: async () => {} }, isReady: async () => {},
  });
  t.after(() => app.close());
  const expected = [['POST','/api/v2/leave-types/'],['GET','/api/v2/leave-types/'],['PUT','/api/v2/leave-types/:id'],['DELETE','/api/v2/leave-types/:id']];
  for (const [method,url] of expected) assert.ok(app.applicationRoutes.some(route => route.method === method && route.url === url), `missing ${method} ${url}`);
  const response = await app.inject({ method: 'POST', url: '/api/v2/leave-types/', headers: { authorization: 'Bearer token' }, payload: { name: 'Annual Leave', code: 'al', daysPerYear: 18 } });
  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.json(), { success: true, code: 200, message: 'Success', data: { name: 'Annual Leave', code: 'AL' }, error: null });
  const invalid = await app.inject({ method: 'POST', url: '/api/v2/leave-types/', headers: { authorization: 'Bearer token' }, payload: { name: 'Annual', code: 'TOOLONG', daysPerYear: -1 } });
  assert.equal(invalid.statusCode, 406);
  await app.ready();
  const paths = app.swagger().paths;
  assert.ok(paths['/api/v2/leave-types/'].post.responses['201']);
  assert.ok(paths['/api/v2/leave-types/{id}'].delete);
});
