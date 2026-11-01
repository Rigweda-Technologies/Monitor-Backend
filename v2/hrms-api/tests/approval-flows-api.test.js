import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

test('approval-flow API exposes four documented operations with v1 envelopes', async t => {
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false, authService: {}, authenticate: async () => ({ userId: 'u', organizationId: 'o' }), authorize: async () => null,
    approvalFlowService: { create: async request => ({ name: request.body.name, steps: request.body.steps }), list: async () => [], update: async () => ({}), remove: async () => ({ isActive: false }) }, isReady: async () => {},
  });
  t.after(() => app.close());
  const expected = [['POST','/api/v2/approval-flows/'],['GET','/api/v2/approval-flows/'],['PUT','/api/v2/approval-flows/:id'],['DELETE','/api/v2/approval-flows/:id']];
  for (const [method,url] of expected) assert.ok(app.applicationRoutes.some(route => route.method === method && route.url === url), `missing ${method} ${url}`);
  const created = await app.inject({ method: 'POST', url: '/api/v2/approval-flows/', headers: { authorization: 'Bearer token' }, payload: { moduleKey: 'leave', name: 'Leave Approval', minDays: 0, steps: [{ stepNumber: 1, approverType: 'manager' }] } });
  assert.equal(created.statusCode, 201);
  assert.deepEqual(created.json(), { success: true, code: 200, message: 'Approval flow created', data: { name: 'Leave Approval', steps: [{ stepNumber: 1, approverType: 'manager' }] }, error: null });
  await app.ready();
  assert.ok(app.swagger().paths['/api/v2/approval-flows/'].post.responses['201']);
  assert.ok(app.swagger().paths['/api/v2/approval-flows/{id}'].delete);
});
