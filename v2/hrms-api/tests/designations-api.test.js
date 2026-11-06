import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

test('designation routes expose four documented operations and retain create response contract', async t => {
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false, authService: {}, authenticate: async () => ({ userId: 'u', organizationId: 'o' }), authorize: async () => null,
    designationService: { create: async request => ({ name: request.body.name }), update: async () => ({}), remove: async () => {}, list: async () => [] }, isReady: async () => {},
  });
  t.after(() => app.close());
  const expected = [['POST','/api/v2/designations/'],['PUT','/api/v2/designations/:id'],['DELETE','/api/v2/designations/:id'],['GET','/api/v2/designations/']];
  for (const [method,url] of expected) assert.ok(app.applicationRoutes.some(route => route.method === method && route.url === url), `missing ${method} ${url}`);
  const created = await app.inject({ method: 'POST', url: '/api/v2/designations/', payload: { name: 'Senior Engineer', departmentId: 'd1' }, headers: { authorization: 'Bearer test' } });
  assert.equal(created.statusCode, 201);
  assert.deepEqual(created.json(), { success: true, code: 200, message: 'Designation created', data: { name: 'Senior Engineer' }, error: null });
  await app.ready();
  const paths = app.swagger().paths;
  assert.ok(paths['/api/v2/designations/'].post.responses['201']);
  assert.ok(paths['/api/v2/designations/{id}'].put);
  assert.ok(paths['/api/v2/designations/'].get.parameters.some(parameter => parameter.in === 'query' && parameter.name === 'departmentId'));
});
