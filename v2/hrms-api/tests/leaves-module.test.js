import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { registerLeaveRoutes } from '../src/modules/leaves/leave.routes.js';
import { createLeaveService } from '../src/modules/leaves/leave.service.js';
import { createLeavePolicy } from '../src/modules/leaves/leave.policy.js';
import { createLeaveApproval } from '../src/modules/leaves/leave.approval.js';

const request = (method, url, payload) => ({ method, url, payload, headers: { authorization: 'Bearer test' } });

test('leave routes publish all v1-mapped operations and gate them with auth and permission', async t => {
  const app = Fastify(); t.after(() => app.close());
  await app.register(swagger, { openapi: { info: { title: 'test', version: '1' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } } });
  const calls = [];
  const service = Object.fromEntries(['apply','myLeaves','myLeavesRange','applyContext','list','pendingMyApprovals','action','requestRevert','revertAction'].map(name => [name, async () => { calls.push(name); return []; }]));
  await registerLeaveRoutes(app, { service, authenticate: async req => { req.user = { organizationId: 'org' }; }, authorize: async () => null });
  await app.ready();
  const expected = ['POST /api/v2/leaves/apply','GET /api/v2/leaves/my','GET /api/v2/leaves/my-range','GET /api/v2/leaves/apply-context','GET /api/v2/leaves/','GET /api/v2/leaves/pending/my-approvals','PUT /api/v2/leaves/:id/action','POST /api/v2/leaves/:id/revert-request','PUT /api/v2/leaves/:id/revert-request/action'];
  for (const route of expected) {
    const [method, url] = route.split(' ');
    assert.equal(app.hasRoute({ method, url }), true, route);
  }
  const openapi = app.swagger();
  for (const route of expected) {
    const [method, path] = route.split(' ');
    const openApiPath = path.replace(/:([^/]+)/g, '{$1}');
    assert.ok(openapi.paths[openApiPath]?.[method.toLowerCase()], `OpenAPI missing ${route}`);
  }
  const deniedApp = Fastify(); t.after(() => deniedApp.close());
  await registerLeaveRoutes(deniedApp, { service, authenticate: async req => { req.user = {}; }, authorize: async () => ({ code: 403, message: 'forbidden' }) });
  const denied = await deniedApp.inject(request('GET', '/api/v2/leaves/my'));
  assert.equal(denied.statusCode, 403);
  assert.equal(calls.length, 0);
  const invalid = await app.inject(request('POST', '/api/v2/leaves/apply', { leaveTypeId: 'x', fromDate: '2026-11-01', toDate: '2026-11-01', reason: '123' }));
  assert.equal(invalid.statusCode, 406);
});

test('leave apply scopes employee and balance to authenticated tenant and compensates failed persistence', async () => {
  const calls = [];
  const employee = { _id: 'employee', userId: 'user', organizationId: 'org', employmentLifecycleStatus: 'confirmed' };
  const models = {
    Leave: { findOne: async () => null, create: async () => { throw new Error('write failed'); } },
    Employee: { findOne: async filter => { calls.push(['employee', filter]); return employee; } },
    LeaveType: { findOne: async filter => { calls.push(['leaveType', filter]); return { _id: 'type' }; } },
    Organization: { findById: async id => ({ _id: id, leaveCycleStartMonth: 1 }) },
    LeaveBalance: {
      findOneAndUpdate: async (filter, update) => { calls.push(['reserve', filter, update]); return { _id: 'balance' }; },
      updateOne: async (filter, update) => { calls.push(['restore', filter, update]); },
    },
  };
  const service = createLeaveService(models, { resolvePolicy: async () => ({ effectiveDateKeys: ['2026-11-02'] }) });
  await assert.rejects(service.apply({ user: { userId: 'user', organizationId: 'org' }, body: { leaveTypeId: 'type', fromDate: '2026-11-02', toDate: '2026-11-02', duration: 'full_day', reason: 'Medical leave' } }), /write failed/);
  assert.deepEqual(calls.find(([kind]) => kind === 'employee')[1], { userId: 'user', organizationId: 'org' });
  assert.equal(calls.find(([kind]) => kind === 'leaveType')[1].organizationId, 'org');
  assert.equal(calls.find(([kind]) => kind === 'reserve')[1].organizationId, 'org');
  const restored = calls.find(([kind]) => kind === 'restore');
  assert.equal(restored[2].$inc.pending, -1);
  assert.equal(restored[2].$inc.remaining, 1);
});

test('leave actions delegate manager authorization, approval progression, and revert policy before persistence', async () => {
  const events = [];
  const leave = { _id: 'leave', organizationId: 'org', employeeId: 'target', leaveTypeId: 'type', fromDate: new Date('2026-12-01'), totalDays: 1, status: 'pending', approvalSteps: [{ stepNumber: 1, status: 'pending' }], save: async () => events.push('save'), markModified() {} };
  const models = {
    Leave: { findOne: async () => leave }, Employee: { findOne: async () => ({ _id: 'actor', firstName: 'A', lastName: 'B' }) },
    Organization: { findById: async () => ({ leaveCycleStartMonth: 1 }) },
    LeaveBalance: { findOne: async () => ({ pending: 1, used: 0, remaining: 4, save: async () => events.push('balance') }) },
  };
  const service = createLeaveService(models, {
    authorizeAction: async () => { events.push('authorized'); },
    progressApproval: async () => { events.push('approval'); return { finalStatus: 'approved', steps: [], currentApprovalStep: null }; },
    resolvePolicy: async ({ operation }) => { events.push(operation); return operation === 'timezone' ? 'UTC' : operation === 'request-revert' ? { status: 'pending', totalDays: 1, effectiveDateKeys: ['2026-12-01'] } : leave; },
  });
  await service.actionLeave({ user: { organizationId: 'org', userId: 'user' }, params: { id: 'leave' }, body: { status: 'approved' } });
  assert.ok(events.includes('authorized'));
  assert.ok(events.includes('approval'));
  leave.status = 'approved';
  leave.revertRequest = { status: 'pending', effectiveDateKeys: ['2026-12-01'], totalDays: 1 };
  await service.revertAction({ user: { organizationId: 'org', userId: 'user' }, params: { id: 'leave' }, body: { status: 'rejected', rejectionReason: 'No longer needed' } });
  assert.equal(leave.revertRequest.status, 'rejected');
  assert.equal(leave.revertRequest.rejectionReason, 'No longer needed');
});

test('leave policy applies organization sandwich deductions across week offs', async () => {
  const models = {
    Settings: { findOne: () => ({ select: async () => ({ timezone: 'UTC', sandwichRuleEnabled: true, attendanceLockEnabled: false }) }) },
    Organization: { findById: () => ({ select: async () => ({ timezone: 'UTC' }) }) },
    Holiday: { find: async () => [] },
  };
  const policy = createLeavePolicy(models, { weekOffService: { resolveWeekOffDays: async () => ['Saturday', 'Sunday'] } });
  const result = await policy.resolvePolicy({ operation: 'apply', req: { user: { organizationId: 'org' }, body: { fromDate: '2026-11-06', toDate: '2026-11-09' } }, employee: { shiftId: 'shift' } });
  assert.deepEqual(result.effectiveDateKeys, ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09']);
});

test('approval helper resolves the configured flow and authorizes the assigned manager step', async () => {
  const flow = { _id: 'flow', organizationId: 'org', moduleKey: 'leave', isActive: true, steps: [{ stepNumber: 1, approverType: 'manager' }, { stepNumber: 2, approverType: 'role', roleSlug: 'hr' }] };
  const models = {
    ApprovalFlow: { find: async () => [flow], findOne: async () => flow },
    Role: { findOne: () => ({ select: async () => ({ _id: 'manager-role', slug: 'manager', name: 'Manager' }) }) },
    Employee: {
      findOne: filter => ({ select: async () => filter.userId ? { _id: 'manager' } : { _id: filter._id, managerId: 'manager' } }),
      exists: async () => true,
    },
  };
  const approval = createLeaveApproval(models);
  const resolved = await approval.resolveFlow({ organizationId: 'org', employee: { _id: 'employee', managerId: 'manager' }, totalDays: 2 });
  assert.equal(resolved.flowId, 'flow');
  assert.deepEqual(resolved.steps.map(step => step.status), ['pending', 'queued']);
  const leave = { organizationId: 'org', employeeId: 'employee', approvalFlowId: 'flow', status: 'pending', approvalSteps: resolved.steps, currentApprovalStep: 1, markModified() {}, save: async () => {} };
  await approval.authorizeAction({ req: { user: { userId: 'user', organizationId: 'org', activeRoleId: 'manager-role' }, body: { status: 'approved' } }, leave });
  const progress = await approval.progress({ req: { user: { userId: 'user', organizationId: 'org' }, body: { status: 'approved' } }, leave, actor: { _id: 'manager' } });
  assert.equal(progress.finalStatus, 'pending');
  assert.equal(progress.currentApprovalStep, 2);
  assert.deepEqual(progress.steps.map(step => step.status), ['approved', 'pending']);
});
