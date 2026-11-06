import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

test('leave-balance API exposes four documented operations and legacy envelopes', async t => {
  const app = await buildApp({ config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }), logger: false, authService: {}, authenticate: async () => ({ userId: 'u', organizationId: 'o' }), authorize: async () => null, isReady: async () => {}, leaveBalanceService: { getMy: async () => [{ remaining: 2 }], getEmployee: async () => [], adjustEmployee: async () => ({ balance: { total: 4 } }), adjustAll: async () => ({ count: 1 }) } });
  t.after(() => app.close());
  const routes = [['GET','/api/v2/leave-balances/my'],['GET','/api/v2/leave-balances/employee/:employeeId'],['POST','/api/v2/leave-balances/employee/:employeeId/adjust'],['POST','/api/v2/leave-balances/adjust-all']];
  for (const [method,url] of routes) assert.ok(app.applicationRoutes.some(route => route.method === method && route.url === url), `missing ${method} ${url}`);
  const response = await app.inject({ method: 'POST', url: '/api/v2/leave-balances/adjust-all', headers: { authorization: 'Bearer token' }, payload: { leaveTypeId: '0123456789abcdef01234567', days: 4 } });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { success: true, code: 200, message: 'Leave balance adjusted for all employees successfully', data: { count: 1 }, error: null });
  await app.ready();
  assert.ok(app.swagger().paths['/api/v2/leave-balances/employee/{employeeId}/adjust'].post);
  assert.ok(app.swagger().paths['/api/v2/leave-balances/adjust-all'].post);
});
