import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

test('permission listing is authenticated, permission-guarded and documented', async t => {
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false, authService: { listPermissions: async organizationId => [{ organizationId, code: 'DEPT_VIEW' }] },
    authenticate: async () => ({ userId: 'u', organizationId: 'o' }), authorize: async permission => permission === 'PERMISSION_VIEW' ? null : { code: 403, message: 'denied' },
    isReady: async () => {},
  });
  t.after(() => app.close());
  const response = await app.inject({ url: '/api/v2/permissions/', headers: { authorization: 'Bearer test' } });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { success: true, code: 200, message: 'Permissions fetched successfully', data: [{ organizationId: 'o', code: 'DEPT_VIEW' }], error: null });
  await app.ready();
  const spec = app.swagger();
  assert.ok(spec.paths['/api/v2/permissions/'].get);
  assert.equal(spec.paths['/api/v2/permissions/'].get.summary, 'List organization permissions');
});
