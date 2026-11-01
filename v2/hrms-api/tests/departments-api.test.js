import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

test('department routes keep their five v1 methods and are present in OpenAPI', async t => {
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false,
    authService: {},
    authenticate: async () => ({ userId: 'user', organizationId: 'org', activeRoleId: 'role' }),
    authorize: async () => {},
    departmentService: {
      create: async input => ({ name: input.body.name }), update: async () => ({}),
      remove: async () => ({}), getById: async () => ({}), list: async () => [],
    },
    isReady: async () => {},
  });
  t.after(() => app.close());
  const expected = [
    ['POST', '/api/v2/departments/'], ['PUT', '/api/v2/departments/:id'],
    ['DELETE', '/api/v2/departments/:id'], ['GET', '/api/v2/departments/:id'], ['GET', '/api/v2/departments/'],
  ];
  for (const [method, url] of expected) {
    const route = app.applicationRoutes.find(item => item.method === method && item.url === url);
    assert.ok(route, `missing ${method} ${url}`);
    assert.ok(route.schema?.summary);
    assert.ok(route.schema?.tags?.includes('Departments'));
  }
  await app.ready();
  const spec = app.swagger();
  for (const [method, url] of expected) {
    const path = url.replace(/:([^/]+)/g, '{$1}') || '/';
    assert.ok(spec.paths[path]?.[method.toLowerCase()], `OpenAPI missing ${method} ${path}`);
  }
});

test('department responses keep the v1 success envelope and create status', async t => {
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false, authService: {}, authenticate: async () => ({ userId: 'user' }), authorize: async () => {},
    departmentService: { create: async input => ({ name: input.body.name, organizationId: input.user.organizationId }) },
    isReady: async () => {},
  });
  t.after(() => app.close());
  const response = await app.inject({ method: 'POST', url: '/api/v2/departments/', payload: { name: 'Operations', code: 'OPS' }, headers: { authorization: 'Bearer synthetic' } });
  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.json(), { success: true, code: 201, message: 'Department created successfully', data: { name: 'Operations' }, error: null });
  const invalid = await app.inject({ method: 'POST', url: '/api/v2/departments/', payload: { name: 'Ops 1', code: 'OPS!' }, headers: { authorization: 'Bearer synthetic' } });
  assert.equal(invalid.statusCode, 406);
  assert.deepEqual(invalid.json(), { code: 406, message: 'Only letters and spaces are allowed', data: null, error: [] });
});
