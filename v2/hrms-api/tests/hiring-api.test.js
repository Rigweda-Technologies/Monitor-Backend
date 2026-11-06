import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { registerHiringRoutes } from '../src/modules/hiring/hiring.routes.js';

const operations = ['getOverview','listEmployees','createJob','listJobs','updateJob','removeJob','createCandidate','listCandidates','updateCandidate','updateCandidateStage','releaseOfferLetter','sendRejectionEmail','convertCandidateToEmployee','scheduleInterview','submitInterviewFeedback','removeCandidate'];
const createApp = async ({ service, authorize = async () => null }) => {
  const app = Fastify({ logger: false });
  await app.register(swagger, { openapi: { info: { title: 'test', version: '1.0.0' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } } });
  await registerHiringRoutes(app, { service, authenticate: async request => { request.user = { userId: 'u', organizationId: 'o' }; }, authorize });
  return app;
};

test('hiring API publishes all 16 authenticated routes, permissions, envelopes and OpenAPI operations', async t => {
  const calls = [];
  const service = Object.fromEntries(operations.map(name => [name, async request => { calls.push(name); return name.startsWith('remove') ? undefined : { operation: name }; }]));
  const permissions = [];
  const app = await createApp({ service, authorize: async permission => { permissions.push(permission); return null; } });
  t.after(() => app.close());
  await app.ready();
  const paths = app.swagger().paths;
  assert.equal(Object.values(paths).reduce((sum, path) => sum + Object.keys(path).length, 0), 16);
  for (const path of Object.values(paths)) for (const route of Object.values(path)) assert.ok(route.summary && route.tags?.includes('Hiring') && route.security?.length);
  const headers = { authorization: 'Bearer token' };
  const list = await app.inject({ method: 'GET', url: '/api/v2/hiring/jobs?status=open&search=Engineer', headers });
  assert.deepEqual(list.json(), { success: true, code: 200, message: 'Jobs fetched successfully', data: { operation: 'listJobs' }, error: null });
  const overview = await app.inject({ method: 'GET', url: '/api/v2/hiring/overview', headers });
  assert.equal(overview.json().message, 'Hiring overview fetched successfully');
  const create = await app.inject({ method: 'POST', url: '/api/v2/hiring/jobs', headers, payload: { title: 'Developer' } });
  assert.equal(create.statusCode, 201);
  assert.equal(create.json().message, 'Job created successfully');
  assert.deepEqual(permissions.slice(0, 3), [['HIRING_VIEW','HIRING_MANAGE'], ['HIRING_VIEW','HIRING_MANAGE'], 'HIRING_MANAGE']);
  assert.equal(calls.length, 3);
});

test('hiring blocks unauthorized operations before services', async t => {
  const app = await createApp({ service: { createJob: async () => assert.fail('service must not run') }, authorize: async () => ({ code: 403, message: 'Forbidden' }) });
  t.after(() => app.close());
  const response = await app.inject({ method: 'POST', url: '/api/v2/hiring/jobs', headers: { authorization: 'Bearer token' }, payload: {} });
  assert.equal(response.statusCode, 403);
});

test('hiring rejects invalid job payloads before service execution', async t => {
  const app = await createApp({ service: { createJob: async () => assert.fail('service must not run') } });
  t.after(() => app.close());
  const response = await app.inject({ method: 'POST', url: '/api/v2/hiring/jobs', headers: { authorization: 'Bearer token' }, payload: {} });
  assert.equal(response.statusCode, 406);
});
