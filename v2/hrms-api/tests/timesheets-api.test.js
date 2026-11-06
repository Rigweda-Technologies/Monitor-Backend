import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { registerTimesheetRoutes, timesheetRouteInventory } from '../src/modules/timesheets/timesheet.routes.js';

test('timesheet route group registers all 28 operations with OpenAPI schemas', async t => {
  const app = Fastify({ logger: false });
  const calls = [];
  const service = Object.fromEntries([...new Set(timesheetRouteInventory.map(route => route.operation))].map(operation => [operation, async request => { calls.push({ operation, request }); return { firstName: 'jANE', total: 1 }; }]));
  await app.register(swagger, { openapi: { info: { title: 'test', version: '1' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } } });
  await registerTimesheetRoutes(app, { service, authenticate: async request => { request.user = { userId: 'u', organizationId: 'o' }; }, authorize: async () => null });
  t.after(() => app.close());
  assert.equal(timesheetRouteInventory.length, 28);
  for (const route of timesheetRouteInventory) assert.ok(app.hasRoute({ method: route.method, url: route.path }), `missing ${route.method} ${route.path}`);
  await app.ready();
  const documented = app.swagger().paths;
  for (const route of timesheetRouteInventory) {
    const path = route.path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    assert.ok(documented[path]?.[route.method.toLowerCase()], `undocumented ${route.method} ${route.path}`);
  }
});

test('timesheet routes preserve status, success envelope, name normalization and permission checks', async t => {
  const app = Fastify({ logger: false });
  let requestedPermission;
  await registerTimesheetRoutes(app, {
    service: { checkIn: async request => ({ employee: { firstName: 'jANE', lastName: 'DOE' }, input: request.body }) },
    authenticate: async request => { request.user = { userId: 'u', organizationId: 'o' }; },
    authorize: async permission => { requestedPermission = permission; return null; },
  });
  t.after(() => app.close());
  const result = await app.inject({ method: 'POST', url: '/api/v2/timesheets/check-in', payload: { latitude: 1.5 } });
  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.json(), { success: true, code: 200, message: 'Checked in', data: { employee: { firstName: 'Jane', lastName: 'Doe' }, input: { latitude: 1.5 } }, error: null });
  assert.equal(requestedPermission, 'TIMESHEET_CHECKIN_SELF');
});

test('timesheet validation returns legacy 406 errors before calling a service', async t => {
  const app = Fastify({ logger: false });
  let invoked = false;
  await registerTimesheetRoutes(app, { service: { bulkOverrideAttendance: async () => { invoked = true; } }, authenticate: async () => {}, authorize: async () => null });
  t.after(() => app.close());
  const result = await app.inject({ method: 'POST', url: '/api/v2/timesheets/attendance/matrix/bulk', payload: { status: 'present', employeeIds: ['e'], startDate: '2026-10-01' } });
  assert.equal(result.statusCode, 406);
  assert.deepEqual(result.json(), { code: 406, message: 'Provide date or both startDate and endDate', data: null, error: [] });
  assert.equal(invoked, false);
});

test('attendance request defaults validates query parameters and applies Joi defaults', async t => {
  const app = Fastify({ logger: false });
  await registerTimesheetRoutes(app, { service: { attendanceRequestDefaults: async request => request.query }, authenticate: async () => {}, authorize: async () => null });
  t.after(() => app.close());
  const valid = await app.inject({ method: 'GET', url: '/api/v2/timesheets/attendance/requests/defaults/my?date=2026-11-01' });
  assert.equal(valid.statusCode, 200);
  assert.deepEqual(valid.json().data, { date: '2026-11-01', dayPortion: 'full_day' });
  const invalid = await app.inject({ method: 'GET', url: '/api/v2/timesheets/attendance/requests/defaults/my?date=bad' });
  assert.equal(invalid.statusCode, 406);
});
