import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { registerProjectRoutes } from '../src/modules/projects/project.routes.js';

const createApp = async ({ service, authorize = async () => null }) => {
  const app = Fastify({ logger: false, routerOptions: { ignoreTrailingSlash: true } });
  await app.register(swagger, { openapi: { info: { title: 'test', version: '1.0.0' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } } });
  await registerProjectRoutes(app, { service, authenticate: async request => { request.user = { userId: 'u', organizationId: 'o' }; }, authorize });
  return app;
};

test('projects API exposes all six v1 operations with permissions, envelopes and OpenAPI schemas', async t => {
  const calls = [];
  const service = Object.fromEntries(['create','list','getById','update','listEmployees','remove'].map(name => [name, async request => { calls.push([name, request]); return name === 'remove' ? undefined : { operation: name }; }]));
  const permissions = [];
  const app = await createApp({ service, authorize: async permission => { permissions.push(permission); return null; } });
  t.after(() => app.close());
  await app.ready();
  const paths = app.swagger().paths;
  assert.ok(paths['/api/v2/projects/'].post && paths['/api/v2/projects/'].get);
  assert.ok(paths['/api/v2/projects/employees'].get);
  assert.ok(paths['/api/v2/projects/{id}'].get && paths['/api/v2/projects/{id}'].put && paths['/api/v2/projects/{id}'].delete);
  for (const path of Object.values(paths)) for (const route of Object.values(path)) assert.ok(route.summary && route.tags);
  const headers = { authorization: 'Bearer token' };
  const create = await app.inject({ method: 'POST', url: '/api/v2/projects/', headers, payload: { projectName: 'Alpha', clientName: 'Acme', actualAmount: 20, discountedAmount: 18, paidTo: '507f1f77bcf86cd799439011' } });
  assert.equal(create.statusCode, 201);
  assert.deepEqual(create.json(), { success: true, code: 200, message: 'Project created successfully', data: { operation: 'create' }, error: null });
  const list = await app.inject({ method: 'GET', url: '/api/v2/projects/?status=active&search=Alpha', headers });
  assert.deepEqual(list.json(), { success: true, code: 200, message: 'Projects fetched successfully', data: { operation: 'list' }, error: null });
  assert.equal(calls[1][1].query.status, 'active');
  const employees = await app.inject({ method: 'GET', url: '/api/v2/projects/employees', headers });
  assert.equal(employees.json().message, 'Employees fetched successfully');
  const detail = await app.inject({ method: 'GET', url: '/api/v2/projects/id', headers });
  assert.equal(detail.json().message, 'Project fetched successfully');
  const update = await app.inject({ method: 'PUT', url: '/api/v2/projects/id', headers, payload: { notes: 'updated' } });
  assert.equal(update.json().message, 'Project updated successfully');
  const remove = await app.inject({ method: 'DELETE', url: '/api/v2/projects/id', headers });
  assert.deepEqual(remove.json(), { success: true, code: 200, message: 'Project deleted successfully', data: null, error: null });
  assert.deepEqual(permissions, ['PROJECT_MANAGE',['PROJECT_VIEW','PROJECT_MANAGE'],['PROJECT_VIEW','PROJECT_MANAGE'],['PROJECT_VIEW','PROJECT_MANAGE'],'PROJECT_MANAGE','PROJECT_MANAGE']);
});

test('project input validation is applied before service execution', async t => {
  const app = await createApp({ service: { create: async () => assert.fail('must not call service') } });
  t.after(() => app.close());
  const response = await app.inject({ method: 'POST', url: '/api/v2/projects/', headers: { authorization: 'Bearer token' }, payload: { projectName: 'x' } });
  assert.equal(response.statusCode, 406);
});
