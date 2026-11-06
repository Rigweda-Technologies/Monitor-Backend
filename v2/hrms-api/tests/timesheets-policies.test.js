import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimesheetPolicies } from '../src/modules/timesheets/timesheet.policies.js';
import { endOfDayInTimeZone, getWeekdayForDateKey, parseMonthRangeInTimeZone, startOfDayInTimeZone, toDateKeyInTimeZone } from '../src/modules/timesheets/timesheet.timezone.js';

const fakeModels = ({ flows = [] } = {}) => {
  const ApprovalFlow = { findOne: async query => flows.find(flow => String(flow._id) === String(query._id) && flow.organizationId === query.organizationId && flow.moduleKey === query.moduleKey && flow.isActive) || null, find: async query => flows.filter(flow => flow.organizationId === query.organizationId && flow.moduleKey === query.moduleKey && flow.isActive) };
  const Employee = { findOne: query => ({ select: async () => query.userId ? ({ _id: 'actor-1', managerId: 'manager-1' }) : ({ _id: query._id, userId: 'recipient-user', firstName: 'rAE', lastName: 'smith', employeeCode: 'E1', managerId: 'manager-1' }) }), find: () => ({ select: async () => [{ _id: 'recipient-employee', userId: 'recipient-user', firstName: 'rAE', lastName: 'smith', employeeCode: 'E1' }] }) };
  const Role = { findOne: query => ({ select: async () => ({ _id: query._id, slug: 'hr', name: 'Human Resources' }) }), find: () => ({ select: async () => [{ _id: 'role-hr', slug: 'hr', name: 'Human Resources' }] }) };
  const OrgUser = { find: () => ({ select: async () => [{ userId: 'recipient-user' }] }) };
  return { ApprovalFlow, Employee, Role, OrgUser };
};
const weekOffService = { resolveWeekOffMapForEmployees: async () => ({ defaultDays: [0], employeeMap: new Map() }), resolveWeekOffDays: async () => [0] };

test('timezone helpers retain local date boundaries across DST transitions', () => {
  assert.equal(toDateKeyInTimeZone(new Date('2026-03-08T04:30:00.000Z'), 'America/New_York'), '2026-03-07');
  assert.equal(toDateKeyInTimeZone(new Date('2026-03-08T07:30:00.000Z'), 'America/New_York'), '2026-03-08');
  assert.equal(startOfDayInTimeZone('2026-03-08', 'America/New_York').toISOString(), '2026-03-08T05:00:00.000Z');
  assert.equal(endOfDayInTimeZone('2026-03-08', 'America/New_York').toISOString(), '2026-03-09T03:59:59.999Z');
  assert.equal(getWeekdayForDateKey('2026-03-08', 'America/New_York'), 0);
});

test('timezone month ranges use the organization zone and preserve month day count', () => {
  const range = parseMonthRangeInTimeZone('2026-11', 'Asia/Kolkata');
  assert.equal(range.start.toISOString(), '2026-10-31T18:30:00.000Z');
  assert.equal(range.end.toISOString(), '2026-11-30T18:29:59.999Z');
  assert.equal(range.daysInMonth, 30);
  assert.equal(range.startKey, '2026-11-01');
  assert.equal(range.endKey, '2026-11-30');
});

test('approval flow chooses the most specific matching range and routes manager steps', async () => {
  const flows = [
    { _id: 'default', organizationId: 'org', moduleKey: 'attendance_request', isActive: true, createdAt: new Date('2026-01-03'), steps: [{ stepNumber: 1, approverType: 'role', roleSlug: 'hr' }] },
    { _id: 'broad', organizationId: 'org', moduleKey: 'attendance_request', isActive: true, minDays: 1, maxDays: 10, createdAt: new Date('2026-01-03'), steps: [{ stepNumber: 1, approverType: 'role', roleSlug: 'admin' }] },
    { _id: 'narrow', organizationId: 'org', moduleKey: 'attendance_request', isActive: true, minDays: 2, maxDays: 4, createdAt: new Date('2026-01-01'), steps: [{ stepNumber: 1, approverType: 'manager' }, { stepNumber: 2, approverType: 'role', roleSlug: 'hr' }] },
  ];
  const policy = createTimesheetPolicies({ models: fakeModels({ flows }), weekOffService });
  const result = await policy.resolveApplicableFlow({ organizationId: 'org', moduleKey: 'attendance_request', subjectEmployee: { managerId: 'manager-1' }, totalDays: 3 });
  assert.equal(result.flowId, 'narrow');
  assert.deepEqual(result.steps.map(step => [step.approverType, step.approverEmployeeId, step.status]), [['manager', 'manager-1', 'pending'], ['role', null, 'queued']]);
  assert.equal((await policy.resolveApplicableFlow({ organizationId: 'org', moduleKey: 'attendance_request', subjectEmployee: {}, totalDays: 20 })).flowId, 'default');
});

test('approval policy rejects invalid preferred flow and unassigned manager routes', async () => {
  const policy = createTimesheetPolicies({ models: fakeModels({ flows: [{ _id: 'manager-flow', organizationId: 'org', moduleKey: 'attendance_request', isActive: true, steps: [{ stepNumber: 1, approverType: 'manager' }] }] }), weekOffService });
  await assert.rejects(policy.resolveApplicableFlow({ organizationId: 'org', moduleKey: 'attendance_request', preferredFlowId: 'missing' }), error => error.statusCode === 500 && /missing, inactive, or invalid/.test(error.message));
  await assert.rejects(policy.resolveApplicableFlow({ organizationId: 'org', moduleKey: 'attendance_request', subjectEmployee: {}, totalDays: 1 }), error => error.statusCode === 500 && /Manager is not assigned/.test(error.message));
});

test('approval progression repairs stale pending state, advances one queued step, and rejects stale action', () => {
  const policy = createTimesheetPolicies({ models: fakeModels(), weekOffService });
  const resolved = policy.resolveCurrentPendingStep({ steps: [{ stepNumber: 1, status: 'approved' }, { stepNumber: 2, status: 'queued' }], currentApprovalStep: 2 });
  assert.equal(resolved.repaired, true);
  assert.equal(resolved.currentStep.status, 'pending');
  const advanced = policy.advanceApprovalSteps({ steps: resolved.steps, action: 'approved', actionBy: 'actor-1', remarks: '' });
  assert.equal(advanced.finalStatus, 'approved');
  assert.equal(advanced.currentApprovalStep, null);
  assert.equal(advanced.steps[1].actionBy, 'actor-1');
  assert.deepEqual(policy.advanceApprovalSteps({ steps: [], action: 'approved' }), { steps: [], finalStatus: 'approved', isIntermediateApproval: false, currentApprovalStep: null });
  assert.throws(() => policy.advanceApprovalSteps({ steps: [{ stepNumber: 1, status: 'approved' }], action: 'approved' }), /No pending approval step/);
});

test('approval recipient resolution matches role aliases and only returns active employee recipients', async () => {
  const policy = createTimesheetPolicies({ models: fakeModels(), weekOffService });
  assert.equal(policy.canActorApproveStep({ approverType: 'role', approverRoleSlug: 'human_resources' }, { actorRoleSlug: 'hr', actorRoleName: 'Human Resources' }), true);
  assert.equal(policy.canActorApproveStep({ approverType: 'manager', approverEmployeeId: 'manager-1' }, { actorEmployeeId: 'manager-1' }), true);
  assert.equal(policy.canActorApproveStep({ approverType: 'role', approverRoleSlug: 'hr' }, { actorRoleSlug: 'employee' }), false);
  const recipient = await policy.resolveRecipientsForStep({ organizationId: 'org', step: { approverType: 'role', approverRoleSlug: 'hr' } });
  assert.equal(recipient.length, 1);
  assert.equal(recipient[0].employeeId, 'recipient-employee');
  assert.equal((await policy.resolveRecipientsForStep({ organizationId: 'org', step: { approverType: 'role' } })).length, 0);
});

test('approval actor context is scoped to the authenticated organization and active role', async () => {
  const models = fakeModels(); const calls = [];
  models.Employee.findOne = query => ({ select: async fields => { calls.push(['employee', query, fields]); return { _id: 'actor-employee' }; } });
  models.Role.findOne = query => ({ select: async fields => { calls.push(['role', query, fields]); return { _id: 'role-hr', slug: 'hr', name: 'Human Resources' }; } });
  const policy = createTimesheetPolicies({ models, weekOffService });
  const result = await policy.getActorApprovalContext({ user: { userId: 'user-1', organizationId: 'org-1', activeRoleId: 'role-hr' } });
  assert.deepEqual(result, { actorEmployeeId: 'actor-employee', actorRoleId: 'role-hr', actorRoleSlug: 'hr', actorRoleName: 'Human Resources' });
  assert.deepEqual(calls.map(call => call[1]), [
    { userId: 'user-1', organizationId: 'org-1' },
    { _id: 'role-hr', organizationId: 'org-1' },
  ]);
});

test('leave date analysis applies sandwich deductions only between working leave days', () => {
  const policy = createTimesheetPolicies({ models: fakeModels(), weekOffService });
  const analysis = policy.analyzeLeaveDateKeys({ fromDate: '2026-11-06', toDate: '2026-11-09', weekOffDays: [0, 6], holidaySet: new Set(), sandwichRuleEnabled: true, timeZone: 'Asia/Kolkata' });
  assert.deepEqual(analysis.workingDateKeys, ['2026-11-06', '2026-11-09']);
  assert.deepEqual(analysis.effectiveDateKeys, ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09']);
  assert.deepEqual(analysis.sandwichWeekOffDateKeys, ['2026-11-07', '2026-11-08']);
});
