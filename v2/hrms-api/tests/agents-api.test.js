import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { registerAgentRoutes } from '../src/modules/agents/agent.routes.js';

const createApp = async ({ service, allowed = true } = {}) => {
  const app = Fastify();
  app.setSerializerCompiler(() => data => JSON.stringify(data));
  app.decorate('applicationRoutes', []);
  await app.register(swagger, { openapi:{info:{title:'test',version:'1'},components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer'}}}} });
  app.addHook('onRoute', route => { if (route.method !== 'HEAD') app.applicationRoutes.push({ method:route.method, url:route.url, schema:route.schema }); });
  await registerAgentRoutes(app, {
    service: service || Object.fromEntries(['getMe','getCloudinarySettings','saveCloudinarySettings','testCloudinarySettings','getCloudinaryUploadConfig','getUsbControlConfig','createUploadSession','completeUploadSession','getScreenshots','saveHealth'].map(key => [key, async (...args) => ({ key, args })])),
    authenticate: async request => { request.user = { userId: 'u1', organizationId: 'o1' }; },
    authorize: async () => allowed ? null : { code: 403, message: 'Denied' },
  });
  await app.ready();
  return app;
};

test('registers every agent route with OpenAPI schema and preserves aliases', async () => {
  const app = await createApp();
  try {
    const routes = app.applicationRoutes.filter(route => route.url.startsWith('/api/v2/agents'));
    assert.equal(routes.length, 16);
    assert.ok(routes.every(route => route.schema?.summary && route.schema?.tags?.includes('Agents')));
    assert.ok(routes.some(route => route.url === '/api/v2/agents/me'));
    assert.ok(routes.some(route => route.url === '/api/v2/agents/monitor-settings/cloudinary'));
    assert.ok(routes.some(route => route.url === '/api/v2/agents/cloudinary'));
    assert.ok(routes.some(route => route.url === '/api/v2/agents/screenshot-batches/:batchId/complete'));
    const paths = app.swagger().paths;
    assert.ok(paths['/api/v2/agents/me']?.get);
    assert.ok(paths['/api/v2/agents/screenshot-batches/{batchId}/complete']?.post);
    for (const item of Object.values(paths)) for (const endpoint of Object.values(item)) if (endpoint.tags?.includes('Agents')) assert.ok(endpoint.summary && endpoint.security);
  } finally { await app.close(); }
});

test('agent profile keeps success envelope and permission is enforced', async () => {
  const service = { getMe: async request => ({ user: request.user.userId }) };
  const app = await createApp({ service });
  try {
    const result = await app.inject({ method: 'GET', url: '/api/v2/agents/me' });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.json().data, { user: 'u1' });
    const denied = await createApp({ service, allowed: false });
    try { assert.equal((await denied.inject({ method: 'GET', url: '/api/v2/agents/me' })).statusCode, 403); }
    finally { await denied.close(); }
  } finally { await app.close(); }
});

test('upload creation preserves 201 and forwards organization identity', async () => {
  let args;
  const app = await createApp({ service: { createUploadSession: async (...values) => { args = values; return { batchId: 'b1' }; } } });
  try {
    const response = await app.inject({ method: 'POST', url: '/api/v2/agents/screenshot-batches/uploads', payload: { batchId:'b1', deviceId:'d1', screenshots:[{ clientScreenshotId:'s1', capturedAt:'2026-01-01T00:00:00.000Z', originalFileName:'x.png', mimeType:'image/png', sha256:'a'.repeat(64), sizeBytes:10 }] } });
    assert.equal(response.statusCode, 201);
    assert.equal(args[0].user.organizationId, 'o1');
    assert.equal(response.json().message, 'Cloudinary upload session created successfully');
  } finally { await app.close(); }
});
