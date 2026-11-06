import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

test('role API exposes six documented v1 methods and preserves role-switch token response', async t => {
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false, authService: {}, authenticate: async () => ({ userId: 'u', organizationId: 'o', roleIds: ['r'], activeRoleId: 'r' }),
    authorize: async () => null, roleService: {
      create: async () => ({}), update: async () => ({}), remove: async () => {}, list: async () => [], getById: async () => ({}),
      switchRole: async () => ({ token: 'new-token', activeRoleId: 'role-id', activeRole: { _id: 'role-id', name: 'HR', slug: 'hr' } }),
    }, isReady: async () => {},
  });
  t.after(() => app.close());
  const expected = [
    ['POST','/api/v2/roles/'], ['PUT','/api/v2/roles/:id'], ['DELETE','/api/v2/roles/:id'],
    ['GET','/api/v2/roles/'], ['GET','/api/v2/roles/:id'], ['POST','/api/v2/roles/switch'],
  ];
  for (const [method,url] of expected) assert.ok(app.applicationRoutes.some(r => r.method === method && r.url === url), `missing ${method} ${url}`);
  const response = await app.inject({ method: 'POST', url: '/api/v2/roles/switch', payload: { roleId: '507f1f77bcf86cd799439011' }, headers: { authorization: 'Bearer current' } });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers.authorization, 'Bearer new-token');
  assert.deepEqual(response.json(), { success: true, code: 200, message: 'Role switched successfully', data: { token: 'new-token', activeRoleId: 'role-id', activeRole: { _id: 'role-id', name: 'HR', slug: 'hr' } }, error: null });
  await app.ready();
  const paths = app.swagger().paths;
  assert.ok(paths['/api/v2/roles/']?.post?.responses?.['201']);
  assert.ok(paths['/api/v2/roles/switch']?.post?.responses?.['200']);
});
