import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { payrollRouteDefinitions, registerPayrollRoutes } from '../src/modules/payroll/payroll.routes.js';

test('payroll route group preserves all 53 registrations and documents every operation in OpenAPI', async t => {
  assert.equal(payrollRouteDefinitions.length, 53);
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const v1Router = await readFile(path.join(repositoryRoot, 'hrms/back-end/src/modules/payroll/payrollAttendance.routes.js'), 'utf8');
  const v1Routes = [...v1Router.matchAll(/router\.(get|post|put|delete)\(\s*["']([^"']+)["']/gi)].map(([, method, route]) => `${method.toUpperCase()} ${route}`);
  const v2Routes = payrollRouteDefinitions.map(route => `${route.method} ${route.path}`);
  assert.deepEqual([...v2Routes].sort(), [...v1Routes].sort());
  const app = Fastify({ logger: false });
  t.after(() => app.close());
  await app.register(swagger, { openapi: { info: { title: 'Payroll test', version: '2' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } } });
  const service = Object.fromEntries([...new Set(payrollRouteDefinitions.map(route => route.operation))].map(name => [name, async () => null]));
  await registerPayrollRoutes(app, { service, authenticate: async () => {}, authorize: async () => null });
  await app.ready();
  const document = app.swagger();
  const openApiOperations = Object.entries(document.paths).flatMap(([path, methods]) => Object.keys(methods).map(method => `${method.toUpperCase()} ${path}`));
  for (const route of payrollRouteDefinitions) {
    const path = `/api/v2/payroll${route.path}`.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    assert.ok(document.paths[path]?.[route.method.toLowerCase()], `${route.method} ${path} missing from OpenAPI`);
    assert.ok(openApiOperations.includes(`${route.method} ${path}`));
    assert.ok(document.paths[path][route.method.toLowerCase()].summary);
    assert.ok(document.paths[path][route.method.toLowerCase()].security);
  }
});

test('payroll route group applies the v1 Joi validation response and authorization permissions', async t => {
  const app = Fastify({ logger: false });
  t.after(() => app.close());
  let requiredPermission;
  const service = { createPayGroup: async request => request.body };
  await registerPayrollRoutes(app, { service, authenticate: async request => { request.user = { organizationId: 'org-1' }; }, authorize: async (permission) => { requiredPermission = permission; return null; } });
  await app.ready();
  const invalid = await app.inject({ method: 'POST', url: '/api/v2/payroll/pay-groups', payload: {} });
  assert.equal(invalid.statusCode, 406);
  assert.deepEqual(invalid.json(), { code: 406, message: '"code" is required', data: null, error: [] });
  const created = await app.inject({ method: 'POST', url: '/api/v2/payroll/pay-groups', payload: { code: 'monthly', name: 'Monthly', payFrequency: 'monthly', salaryPayDay: 30 } });
  assert.equal(created.statusCode, 201);
  assert.equal(created.json().success, true);
  assert.equal(requiredPermission, 'PAYROLL_CONFIG_MANAGE');
});

test('payroll idempotent actions use the service idempotency workflow', async t => {
  const app = Fastify({ logger: false });
  t.after(() => app.close());
  let call;
  const service = { createRun: async () => { throw new Error('must use executeAction'); }, executeAction: async input => { call = input; return { id: 'run-1' }; } };
  await registerPayrollRoutes(app, { service, authenticate: async () => {}, authorize: async () => null, idempotencyRequired: true });
  await app.ready();
  const response = await app.inject({ method: 'POST', url: '/api/v2/payroll/runs', headers: { 'idempotency-key': 'run-once' }, payload: { payGroupId: '00000000-0000-4000-8000-000000000001', payMonth: '2026-10' } });
  assert.equal(response.statusCode, 201);
  assert.equal(call.operation, 'createRun');
  assert.equal(call.request.idempotencyKey, 'run-once');
  const alternate = await app.inject({ method: 'POST', url: '/api/v2/payroll/runs', headers: { 'x-idempotency-key': 'another_key' }, payload: { payGroupId: '00000000-0000-4000-8000-000000000001', payMonth: '2026-10' } });
  assert.equal(alternate.statusCode, 201);
  assert.equal(call.request.idempotencyKey, 'another_key');
  const malformed = await app.inject({ method: 'POST', url: '/api/v2/payroll/runs', headers: { 'idempotency-key': 'bad key' }, payload: { payGroupId: '00000000-0000-4000-8000-000000000001', payMonth: '2026-10' } });
  assert.equal(malformed.statusCode, 406);
  assert.equal(malformed.json().message, 'Invalid Idempotency-Key format. Use 8-120 chars with letters, numbers, colon, underscore or hyphen.');
  const missing = await app.inject({ method: 'POST', url: '/api/v2/payroll/runs', payload: { payGroupId: '00000000-0000-4000-8000-000000000001', payMonth: '2026-10' } });
  assert.equal(missing.statusCode, 400);
  assert.equal(missing.json().message, 'Idempotency-Key header is required for this action');
});
