import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { createRuntime } from '../src/runtime.js';
import { loadConfig } from '../src/config/env.js';
import { createModels } from '../src/modules/auth/auth.models.js';
import { createEmployeeModels } from '../src/modules/employees/employee.models.js';
import { createOrgSettingsModels } from '../src/modules/org-settings/org-settings.models.js';
import { createDepartmentModels } from '../src/modules/departments/department.models.js';
import { createHolidayModels } from '../src/modules/holidays/holiday.models.js';
import { createWeekOffModels } from '../src/modules/week-offs/week-off.models.js';
import { createWeekOffService } from '../src/modules/week-offs/week-off.service.js';
import { createShiftModels } from '../src/modules/shifts/shift.models.js';
import { createApprovalFlowModels } from '../src/modules/approval-flows/approval-flow.models.js';
import { createLeaveModels } from '../src/modules/leaves/leave.models.js';
import { createTimesheetModels } from '../src/modules/timesheets/timesheet.models.js';
import { timesheetRouteInventory } from '../src/modules/timesheets/timesheet.routes.js';

const baseUri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const localTestUri = Boolean(baseUri) && ['localhost', '127.0.0.1', '::1'].includes(new URL(baseUri).hostname) && /[_-](test|isolated|ci)([_-]|$)/i.test(new URL(baseUri).pathname);
const uriFor = suffix => { const url = new URL(baseUri); url.pathname = `${url.pathname.replace(/\/$/, '')}_timesheets_${suffix}`; return url.toString(); };
const setFor = connection => {
  const employee = createEmployeeModels(connection);
  const shared = createModels(connection);
  const orgSettings = createOrgSettingsModels(connection);
  const departments = createDepartmentModels(connection);
  const holidays = createHolidayModels(connection);
  const weekOffs = createWeekOffModels(connection);
  const shifts = createShiftModels(connection);
  const approvalFlows = createApprovalFlowModels(connection);
  const leaves = createLeaveModels(connection);
  const timesheets = createTimesheetModels(connection);
  return { ...shared, ...employee, ...orgSettings, ...departments, ...holidays, ...weekOffs, ...shifts, ...approvalFlows, ...leaves, ...timesheets };
};
const readJson = async response => ({ status: response.status, contentType: response.headers.get('content-type'), body: await response.json() });
const withTimeout = (promise, label, timeoutMs = 10000) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), timeoutMs); })]).finally(() => clearTimeout(timer));
};
const normalizeGeneratedTimesheet = value => {
  if (Array.isArray(value)) return value.map(normalizeGeneratedTimesheet);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key)).map(([key, item]) => [key, normalizeGeneratedTimesheet(item)]));
};

test('V1/V2 timesheets route contract parity on isolated local Mongo fixtures', { skip: !baseUri }, async t => {
  assert.ok(localTestUri, 'V2_HRMS_ISOLATED_TEST_DATABASE_URL must point to a local Mongo database named as test/isolated/ci');
  const secret = 'timesheets-contract-parity-test-secret-0123456789';
  const ids = { organization: new mongoose.Types.ObjectId(), user: new mongoose.Types.ObjectId(), noEmployee: new mongoose.Types.ObjectId(), role: new mongoose.Types.ObjectId(), employee: new mongoose.Types.ObjectId() };
  const permissions = Object.fromEntries(['TIMESHEET_CHECKIN_SELF','TIMESHEET_VIEW_SELF','TIMESHEET_CREATE_SELF','TIMESHEET_EDIT_SELF','TIMESHEET_SUBMIT_SELF','TIMESHEET_RECALL_SELF','TIMESHEET_VIEW_ALL','TIMESHEET_VIEW_ONLINE','ATTENDANCE_VIEW_SELF','ATTENDANCE_VIEW_ALL','ATTENDANCE_MANAGE'].map(code => [code, new mongoose.Types.ObjectId()]));
  const validToken = jwt.sign({ userId: ids.user, organizationId: ids.organization, activeRoleId: ids.role, roleIds: [ids.role] }, secret, { expiresIn: '1h' });
  const noRoleToken = jwt.sign({ userId: ids.user, organizationId: ids.organization, roleIds: [ids.role] }, secret, { expiresIn: '1h' });
  const noEmployeeToken = jwt.sign({ userId: ids.noEmployee, organizationId: ids.organization, activeRoleId: ids.role, roleIds: [ids.role] }, secret, { expiresIn: '1h' });
  const identities = new Map([
    [validToken, { userId: ids.user, _id: ids.user, email: 'employee@example.test', organizationId: ids.organization, activeRoleId: ids.role, rolePermissions: Object.keys(permissions) }],
    [noRoleToken, { userId: ids.user, _id: ids.user, email: 'employee@example.test', organizationId: ids.organization, rolePermissions: Object.keys(permissions) }],
    [noEmployeeToken, { userId: ids.noEmployee, _id: ids.noEmployee, email: 'without-employee@example.test', organizationId: ids.organization, activeRoleId: ids.role, rolePermissions: Object.keys(permissions) }],
  ]);
  const v1Connection = await withTimeout(mongoose.createConnection(uriFor('v1'), { autoCreate: false, autoIndex: false }).asPromise(), 'V1 Mongo connection');
  const v2Connection = await withTimeout(mongoose.createConnection(uriFor('v2'), { autoCreate: false, autoIndex: false }).asPromise(), 'V2 Mongo connection');
  const v1Models = setFor(v1Connection);
  const config = loadConfig({ MONGODB_URI: uriFor('v2'), JWT_SECRET: secret, BCRYPT_SALT_ROUNDS: '4' });
  const v2 = await withTimeout(createRuntime({ config, connection: v2Connection, logger: false, realtimeEnabled: false, sendOtp: async () => {}, verifySelfie: async () => ({ confidence: 99 }) }), 'V2 runtime construction');

  const v1Auth = (request, reply, next) => {
    const token = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : '';
    if (!token) return reply.status(401).json({ success: false, code: 401, message: 'Authorization token missing', data: null, error: null });
    const identity = identities.get(token);
    if (!identity) return reply.status(401).json({ success: false, code: 401, message: 'Invalid or expired token', data: null, error: null });
    request.user = { ...identity };
    return next();
  };
  const v1Authorize = required => async (request, reply, next) => {
    if (!request.user?.activeRoleId) return reply.status(403).json({ success: false, code: 403, message: 'Access denied: active role not set', data: null, error: null });
    const requiredCodes = Array.isArray(required) ? required : [required];
    if (requiredCodes.some(code => request.user.rolePermissions?.includes(code))) return next();
    return reply.status(403).json({ success: false, code: 403, message: `Permission denied: ${requiredCodes.join(' | ')}`, data: null, error: null });
  };
  const v1 = createLegacyRouterHarness({
    mounts: [{ path: '/api/v1/timesheets', modulePath: 'src/modules/timesheets/timesheet.routes.js' }],
    identity: {}, environment: { JWT_SECRET: secret, NODE_ENV: 'production', FACEPP_API_KEY: 'synthetic', FACEPP_API_SECRET: 'synthetic' },
    overrides: {
      'src/middlewares/auth.middleware.js': v1Auth,
      'src/middlewares/authorize.middleware.js': v1Authorize,
      'src/modules/users/user.model.js': v1Models.User,
      'src/modules/organizations/org-user.model.js': v1Models.Membership,
      'src/modules/organizations/organization.model.js': v1Models.Organization,
      'src/modules/roles/role.model.js': v1Models.Role,
      'src/modules/permissions/permission.model.js': v1Models.Permission,
      'src/modules/employees/employee.model.js': v1Models.Employee,
      'src/modules/orgSettings/orgSettings.model.js': v1Models.OrgSettings,
      'src/modules/timesheets/timesheet.model.js': v1Models.Timesheet,
      'src/modules/timesheets/timesheetAttendance.model.js': v1Models.Attendance,
      'src/modules/timesheets/attendanceRequest.model.js': v1Models.AttendanceRequest,
      'src/modules/leaves/leave.model.js': v1Models.Leave,
      'src/modules/auditLogs/auditLogs.model.js': v1Models.AuditLog,
      'src/modules/auditLogs/auditLogs.service.js': { audit: async ({ req, module, action, entityId, before, after }) => v1Models.AuditLog.create({ organizationId: req.user.organizationId, userId: req.user._id || req.user.userId, module, action, entityId, before, after, ipAddress: req.ip, userAgent: req.headers?.['user-agent'] || '' }) },
      'src/modules/weekOffs/weekOff.service.js': createWeekOffService({ WeekOff: v1Models.WeekOff }),
      'src/modules/holidays/holiday.model.js': v1Models.Holiday,
      'src/modules/shifts/shift.model.js': v1Models.Shift,
      'src/modules/approvalFlows/approvalFlow.model.js': v1Models.ApprovalFlow,
      'src/modules/notifications/notification.service.js': { createNotificationSafe: async () => false },
      'src/modules/payroll/payrollAttendance.service.js': { listMonthlyAttendanceSnapshots: async () => ({ count: 0 }), generateMonthlyAttendanceSnapshots: async () => ({ generatedCount: 0 }) },
      'src/config/monitorDb.js': { getMonitorPgPool: async () => ({ query: async () => ({ rows: [] }) }) },
      'src/realtime/socket.js': { emitAttendanceUpdate: () => {} },
    },
    sendMail: async () => true,
  });
  const legacyServer = v1.listen(0, '127.0.0.1');
  await withTimeout(new Promise(resolve => legacyServer.once('listening', resolve)), 'V1 router listen');
  t.after(async () => {
    await new Promise(resolve => legacyServer.close(resolve));
    await v2.close();
    await v1Connection.dropDatabase(); await v2Connection.dropDatabase();
    await v1Connection.close(); await v2Connection.close();
  });

  const seed = async connection => {
    const models = setFor(connection);
    const now = new Date('2026-10-01T00:00:00.000Z');
    const tokenList = [validToken, noRoleToken].map(token => ({ token, organizationId: ids.organization, status: 'active', loginTimestamp: now.toISOString() }));
    await models.Organization.collection.insertOne({ _id: ids.organization, name: 'Parity Org', code: 'PARITY-TS', timezone: 'Asia/Kolkata', currency: 'INR', status: 'active', leaveCycleStartMonth: 1, createdAt: now, updatedAt: now });
    await models.User.collection.insertMany([
      { _id: ids.user, email: 'employee@example.test', password: 'synthetic', organizationIds: [ids.organization], activeOrganizationId: ids.organization, tokenList, status: 'active', createdAt: now, updatedAt: now },
      { _id: ids.noEmployee, email: 'without-employee@example.test', password: 'synthetic', organizationIds: [ids.organization], activeOrganizationId: ids.organization, tokenList: [{ token: noEmployeeToken, organizationId: ids.organization, status: 'active', loginTimestamp: now.toISOString() }], status: 'active', createdAt: now, updatedAt: now },
    ]);
    await models.Permission.collection.insertMany(Object.entries(permissions).map(([code, _id]) => ({ _id, organizationId: ids.organization, code, name: code, createdAt: now, updatedAt: now })));
    await models.Role.collection.insertOne({ _id: ids.role, organizationId: ids.organization, name: 'Employee', slug: 'employee', permissionIds: Object.values(permissions).filter((_, index) => index !== 11), isSystemRole: false, status: 'active', createdAt: now, updatedAt: now });
    await models.Membership.collection.insertMany([
      { userId: ids.user, organizationId: ids.organization, roleIds: [ids.role], createdAt: now, updatedAt: now },
      { userId: ids.noEmployee, organizationId: ids.organization, roleIds: [ids.role], createdAt: now, updatedAt: now },
    ]);
    await models.Employee.collection.insertOne({ _id: ids.employee, organizationId: ids.organization, userId: ids.user, firstName: 'casey', lastName: 'Employee', employeeCode: 'E-001', dateOfJoining: now, employmentType: 'full_time', employmentLifecycleStatus: 'confirmed', status: 'active', isDeleted: false, createdAt: now, updatedAt: now });
    await models.OrgSettings.collection.insertOne({ organizationId: ids.organization, timezone: 'Asia/Kolkata', attendanceHoursSource: 'manual', attendanceLockEnabled: false, minWorkHoursPerDay: 8, minHalfDayHours: 4, createdAt: now, updatedAt: now });
  };
  await seed(v1Connection); await seed(v2Connection);

  const v1Base = `http://127.0.0.1:${legacyServer.address().port}`;
  const requestPair = async ({ method = 'GET', path, token = validToken, payload, normalizeBody = false }) => {
    const headers = {}; if (token) headers.authorization = `Bearer ${token}`;
    if (payload !== undefined) headers['content-type'] = 'application/json';
    const init = { method, headers, ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}) };
    const expected = await readJson(await withTimeout(fetch(`${v1Base}/api/v1/timesheets${path}`, { ...init, signal: AbortSignal.timeout(8000) }), `V1 ${method} ${path}`));
    const actual = await withTimeout(v2.app.inject({ method, url: `/api/v2/timesheets${path}`, headers, ...(payload !== undefined ? { payload } : {}) }), `V2 ${method} ${path}`);
    const actualResult = { status: actual.statusCode, contentType: actual.headers['content-type'], body: actual.json() };
    assert.equal(actualResult.status, expected.status, `${method} ${path} status; V1=${JSON.stringify(expected.body)} V2=${JSON.stringify(actualResult.body)}`);
    assert.equal(actualResult.contentType, expected.contentType, `${method} ${path} content-type`);
    assert.deepEqual(normalizeBody ? normalizeGeneratedTimesheet(actualResult.body) : actualResult.body, normalizeBody ? normalizeGeneratedTimesheet(expected.body) : expected.body, `${method} ${path} body`);
    return expected.body;
  };

  await t.test('successful check-in policy and attendance request defaults match status/body/content-type', async () => {
    await requestPair({ path: '/checkin-policy' });
    await requestPair({ path: '/attendance/requests/defaults/my?date=2026-11-01' });
  });
  await t.test('attendance and request read handlers match on an empty employee fixture', async () => {
    for (const path of [
      '/attendance/my?date=2026-11-01', '/attendance', '/attendance/matrix?month=2026-11',
      '/attendance/matrix/my?month=2026-11', '/attendance/matrix/history?employeeId=' + String(ids.employee) + '&date=2026-11-01',
      '/attendance/matrix/history/my?date=2026-11-01', '/attendance/requests/my', '/attendance/requests',
      '/attendance/requests/pending/my-approvals', '/online', '/on-leave', '/weekly',
    ]) await requestPair({ path });
  });
  await t.test('weekly create and read-back preserve status/body after generated-id/timestamp normalization', async () => {
    await requestPair({ method: 'POST', path: '/weekly', payload: { weekStart: '2026-11-02', entries: [{ date: '2026-11-02', hours: 7.5, notes: 'synthetic entry' }] }, normalizeBody: true });
    await requestPair({ path: '/weekly/my', normalizeBody: true });
  });
  await t.test('validation, missing-auth, missing-active-role, and permission failures match', async () => {
    await requestPair({ method: 'POST', path: '/attendance/matrix/bulk', payload: { date: '2026-11-01', startDate: '2026-11-01', endDate: '2026-11-02', status: 'present', employeeIds: [String(ids.employee)] } });
    await requestPair({ path: '/weekly/my', token: noRoleToken });
    await requestPair({ method: 'PUT', path: '/weekly/000000000000000000000000/action', payload: { status: 'rejected', rejectionReason: 'not authorized' } });
  });
  await t.test('all 28 registered routes return matching missing-auth status/body/content-type', async () => {
    assert.equal(timesheetRouteInventory.length, 28);
    for (const route of timesheetRouteInventory) {
      const path = route.path.replace('/api/v2/timesheets', '').replace(/:employeeId|:id/g, '000000000000000000000001');
      await requestPair({ method: route.method, path, token: null });
    }
  });
  await t.test('service failure for a user without an employee record matches', async () => {
    await requestPair({ path: '/weekly/my', token: noEmployeeToken });
  });
});
