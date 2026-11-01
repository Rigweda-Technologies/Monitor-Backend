import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { registerMonitorUpdateRoutes } from '../src/modules/monitor-updates/monitor-update.routes.js';

const makeApp = async ({ service, authenticate = async request => { request.user = { userId: 'u' }; } }) => {
  const app = Fastify({ logger: false });
  await app.register(swagger, { openapi: { info: { title: 'test', version: '1.0.0' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } } });
  await registerMonitorUpdateRoutes(app, { service, authenticate });
  return app;
};

test('monitor update routes preserve five authenticated operations, payload precedence, messages and OpenAPI', async t => {
  const calls = [];
  const service = {
    listReleases: async (...args) => { calls.push(['list', args]); return [{ version: '2.0.0' }]; },
    createRelease: async (...args) => { calls.push(['create', args]); return { version: args[0].version }; },
    activateRelease: async (...args) => { calls.push(['activate', args]); return { version: '2.0.0' }; },
    getLatestRelease: async (...args) => { calls.push(['latest', args]); return { updateAvailable: false, version: '1.0.0' }; },
    recordUpdateStatus: async (...args) => { calls.push(['status', args]); return { updateStatus: 'UPDATED' }; },
  };
  let authCalls = 0;
  const app = await makeApp({ service, authenticate: async request => { authCalls += 1; request.user = { userId: 'u' }; } });
  t.after(() => app.close());
  await app.ready();
  const paths = app.swagger().paths;
  assert.ok(paths['/api/v2/monitor/releases'].get && paths['/api/v2/monitor/releases'].post);
  assert.ok(paths['/api/v2/monitor/releases/{releaseId}'].patch);
  assert.ok(paths['/api/v2/monitor/update/latest'].get && paths['/api/v2/monitor/update/status'].post);
  for (const path of Object.values(paths)) for (const route of Object.values(path)) if (route.tags?.includes('Monitor Updates')) assert.ok(route.summary && route.security);
  const headers = { authorization: 'Bearer token' };
  const list = await app.inject({ method: 'GET', url: '/api/v2/monitor/releases', headers });
  assert.deepEqual(list.json(), { success: true, code: 200, message: 'Release list fetched successfully', data: [{ version: '2.0.0' }], error: null });
  const create = await app.inject({ method: 'POST', url: '/api/v2/monitor/releases', headers, payload: { version: '2.0.0', fileBase64: 'eA==' } });
  assert.equal(create.statusCode, 201);
  assert.deepEqual(create.json(), { success: true, code: 201, message: 'Release created successfully', data: { version: '2.0.0' }, error: null });
  await app.inject({ method: 'PATCH', url: '/api/v2/monitor/releases/r1', headers, payload: { status: 'active', rolloutPercentage: 35 } });
  await app.inject({ method: 'GET', url: '/api/v2/monitor/update/latest?version=0.9.0', headers: { ...headers, 'x-device-id': 'd1', 'x-app-version': '1.0.0' } });
  await app.inject({ method: 'POST', url: '/api/v2/monitor/update/status', headers, payload: { deviceId: 'd1', status: 'UPDATED' } });
  assert.deepEqual(calls[2][1][0], { releaseId: 'r1', status: 'active', rolloutPercentage: 35 });
  assert.deepEqual(calls[3][1][0], { deviceId: 'd1', appVersion: '1.0.0' });
  assert.deepEqual(calls[4][1][0], { deviceId: 'd1', status: 'UPDATED' });
  assert.equal(authCalls, 5);
});

test('monitor update route returns legacy-shaped failures from service errors', async t => {
  const app = await makeApp({ service: { createRelease: async () => { throw Object.assign(new Error('version is required'), { code: 400 }); } } });
  t.after(() => app.close());
  const response = await app.inject({ method: 'POST', url: '/api/v2/monitor/releases', headers: { authorization: 'Bearer token' }, payload: {} });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), { success: false, code: 400, message: 'version is required', data: null, error: 'version is required' });
});
