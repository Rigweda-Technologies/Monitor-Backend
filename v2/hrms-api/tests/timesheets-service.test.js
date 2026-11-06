import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimesheetService } from '../src/modules/timesheets/timesheet.service.js';
import { timesheetRouteInventory } from '../src/modules/timesheets/timesheet.routes.js';
import { createTimesheetPolicies } from '../src/modules/timesheets/timesheet.policies.js';

const memory = () => {
  const rows = [];
  const Employee = { findOne: async () => ({ _id: 'employee-1' }), find: () => ({ distinct: async () => ['employee-1'] }) };
  const Role = { findOne: () => ({ select: async () => ({ slug: 'employee' }) }) };
  const OrgSettings = { findOne: async () => ({ minHalfDayHours: 4 }) };
  const Timesheet = {
    findOne: async query => rows.find(row => (!query._id || row._id === query._id) && row.organizationId === query.organizationId && row.employeeId === query.employeeId && (!query.weekStart || row.weekStart.getTime() === query.weekStart.getTime())) || null,
    create: async data => { const row = { ...data, _id: `ts-${rows.length + 1}`, toObject() { return { ...this }; }, save: async function () {} }; rows.push(row); return row; },
    find: query => { let result = rows.filter(row => row.organizationId === query.organizationId && (!query.employeeId || (query.employeeId.$in ? query.employeeId.$in.includes(row.employeeId) : row.employeeId === query.employeeId))); const chain = { populate() { return chain; }, sort() { return chain; }, skip(offset) { result = result.slice(offset); return chain; }, limit(limit) { result = result.slice(0, limit); return Promise.resolve(result); }, then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); } }; return chain; },
    countDocuments: async query => rows.filter(row => row.organizationId === query.organizationId).length,
  };
  const models = { Timesheet, Attendance: {}, AttendanceRequest: {}, Employee, Leave: {}, Role, OrgSettings, Organization: {}, Holiday: {}, AuditLog: {}, Shift: {}, ApprovalFlow: {}, User: {} };
  const policies = Object.fromEntries(['WeekOffService','resolveApplicableFlow','buildRuntimeSteps','getActorApprovalContext','canActorApproveStep','resolveRecipientsForStep','advanceApprovalSteps','getCurrentPendingStep','resolveCurrentPendingStep','isValidTimeZone','toDateKeyInTimeZone','addDaysToDateKey','zonedDateTimeToUtc','startOfDayInTimeZone','endOfDayInTimeZone','parseMonthRangeInTimeZone','getDayInTimeZone','getWeekdayForDateKey','analyzeLeaveDateKeys','normalizeAttendanceRequestDateKey'].map(name => [name, name === 'WeekOffService' ? {} : () => null]));
  return { rows, models, policies };
};
const request = (body = {}, params = {}, query = {}) => ({ user: { userId: 'user-1', organizationId: 'org-1' }, body, params, query });
const integrations = extra => ({ audit: async () => {}, sendMail: async () => {}, createNotificationSafe: async () => {}, emitAttendanceUpdate: () => {}, compareAttendanceFaces: async () => ({ passed: true, confidence: 100 }), payrollAttendanceService: { listMonthlyAttendanceSnapshots: async () => ({}), generateMonthlyAttendanceSnapshots: async () => ({}) }, ...extra });
const runtimePolicies = models => createTimesheetPolicies({ models: { ...models, ApprovalFlow: { findOne: async () => null, find: async () => [] }, OrgUser: { find: () => ({ select: async () => [] }) }, }, weekOffService: { resolveWeekOffMapForEmployees: async () => ({ defaultDays: [], employeeMap: new Map() }), resolveWeekOffDays: async () => [] } });

test('timesheet service factory supplies every operation registered by the route group', () => {
  const { models } = memory(); const service = createTimesheetService({ models, policies: runtimePolicies(models), integrations: integrations() });
  for (const operation of new Set(timesheetRouteInventory.map(route => route.operation))) assert.equal(typeof service[operation], 'function', `missing ${operation}`);
});

test('my attendance history preserves Express 5 read-only query behavior from v1', async () => {
  const { models } = memory(); const service = createTimesheetService({ models, policies: runtimePolicies(models), integrations: integrations() });
  service.getAttendanceCellHistory = async req => ({ employeeId: req.query.employeeId });
  const req = request({}, {}, {});
  assert.deepEqual(await service.myAttendanceCellHistory(req), { employeeId: undefined });
});

test('weekly timesheet create stores seven normalized days, sums hours and audits creation', async () => {
  const { rows, models } = memory(); const audits = [];
  const service = createTimesheetService({ models, policies: runtimePolicies(models), integrations: integrations({ audit: async event => audits.push(event) }) });
  const today = new Date(); const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); const mondayKey = monday.toISOString().slice(0, 10);
  const created = await service.createWeekly(request({ weekStart: mondayKey, entries: [{ date: mondayKey, hours: 7.5, notes: 'delivery' }] }));
  assert.equal(rows.length, 1); assert.equal(created.entries.length, 7); assert.equal(created.totalHours, 7.5); assert.equal(created.status, 'draft');
  assert.equal(created.entries[0].notes, 'delivery'); assert.equal(created.entries[1].hours, 0); assert.equal(audits[0].action, 'CREATE');
});

test('weekly timesheet rejects duplicate weeks and prevents submission with under-minimum hours', async () => {
  const { models } = memory(); const service = createTimesheetService({ models, policies: runtimePolicies(models), integrations: integrations() });
  const today = new Date(); const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); const mondayKey = monday.toISOString().slice(0, 10);
  await service.createWeekly(request({ weekStart: mondayKey }));
  await assert.rejects(service.createWeekly(request({ weekStart: mondayKey })), /already exists/);
  await assert.rejects(service.updateWeekly(request({ entries: [{ date: mondayKey, hours: 2 }] }, { id: 'ts-1' })), /Minimum half day hours is 4/);
});
