import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { registerAgentRoutes } from '../src/modules/agents/agent.routes.js';
import { registerMonitorUpdateRoutes } from '../src/modules/monitor-updates/monitor-update.routes.js';

const identity = { userId: 'parity-user', organizationId: 'parity-org', employeeId: 'parity-employee' };
const deny = { code: 403, message: 'Permission denied: parity comparison' };
const settings = { cloudName: 'parity-cloud', apiKey: 'key', apiSecretMasked: '***', updatedAt: '2026-01-01T00:00:00.000Z' };
const agentResults = {
  getCurrentAgent: { profile: 'agent' }, getScreenshots: [{ id: 'shot-1' }], getPublicSettings: settings,
  saveSettings: settings, getUsbControlConfig: { enabled: true }, createUploadSession: { batchId: 'batch-1' },
  completeUploadSession: { status: 'complete' }, saveHealth: { deviceId: 'device-1' },
};
let permitAgent = false;
const service = {
  getMe: async () => agentResults.getCurrentAgent,
  getScreenshots: async () => agentResults.getScreenshots,
  getCloudinarySettings: async () => settings,
  saveCloudinarySettings: async request => {
    if (!request.body?.cloudName || !request.body?.apiKey) throw Object.assign(new Error('Cloud name and API key are required.'),{code:400});
    return settings;
  },
  testCloudinarySettings: async () => ({ ok: true }),
  getCloudinaryUploadConfig: async () => ({ cloudName: settings.cloudName, apiKey: settings.apiKey, updatedAt: settings.updatedAt }),
  getUsbControlConfig: async () => agentResults.getUsbControlConfig,
  createUploadSession: async () => agentResults.createUploadSession,
  completeUploadSession: async () => agentResults.completeUploadSession,
  saveHealth: async request => {
    if (!request.body?.deviceId) throw Object.assign(new Error('Invalid laptop health payload'),{code:400,data:{fields:['deviceId']}});
    return agentResults.saveHealth;
  },
  listReleases: async () => [{ version: '2.0.0' }],
  createRelease: async () => ({ version: '2.0.0' }),
  activateRelease: async () => ({ version: '2.0.0', status: 'active' }),
  getLatestRelease: async ({ appVersion }) => ({ updateAvailable: false, version: appVersion || '1.0.0' }),
  recordUpdateStatus: async payload => ({ deviceId: payload.deviceId, updateStatus: payload.status }),
};

const routeCalls = [
  ['GET','/me'],['GET','/screenshots'],['GET','/monitor-settings/cloudinary'],['GET','/cloudinary'],
  ['PUT','/monitor-settings/cloudinary'],['PUT','/cloudinary'],['POST','/cloudinary'],
  ['POST','/monitor-settings/cloudinary/test'],['POST','/cloudinary/test'],
  ['GET','/monitor-settings/cloudinary/upload-config'],['GET','/cloudinary/upload-config'],
  ['GET','/monitor-settings/usb/control-config'],['GET','/usb/control-config'],
  ['POST','/screenshot-batches/uploads'],['POST','/screenshot-batches/batch-1/complete'],['POST','/health'],
];
const validUpload = { batchId:'batch-1',deviceId:'device-1',screenshots:[{clientScreenshotId:'shot-1',capturedAt:'2026-01-01T00:00:00.000Z',originalFileName:'screen.png',mimeType:'image/png',sha256:'a'.repeat(64),sizeBytes:20}] };
const validComplete = { deviceId:'device-1',uploaded:[],duplicates:[] };
const validSettings = { cloudName:'parity-cloud',apiKey:'key',apiSecret:'secret' };
const agentRequest = (method,path) => {
  if (method === 'GET') return {};
  if (path.endsWith('/uploads')) return validUpload;
  if (path.endsWith('/complete')) return validComplete;
  if (path === '/health') return { deviceId:'device-1' };
  if (path.endsWith('/test')) return validSettings;
  if (method === 'PUT' || path === '/cloudinary') return validSettings;
  return {};
};

const legacy = createLegacyRouterHarness({
  mounts: [
    { path:'/api/v1/agents',modulePath:'src/modules/agent/agent.routes.js' },
    { path:'/api/v1/monitor',modulePath:'src/modules/monitorUpdates/monitorUpdates.routes.js' },
  ],
  identity,
  overrides: {
    'src/middlewares/authorize.middleware.js': () => (_req,res,next) => permitAgent ? next() : res.status(403).json({success:false,code:403,message:deny.message,data:null,error:null}),
    'src/modules/organizations/organization.service.js': { isUserSuperAdmin: async () => false },
    'src/modules/agent/agent.service.js': { getCurrentAgent: async () => agentResults.getCurrentAgent },
    'src/modules/agent/agent.screenshots.service.js': { getScreenshots: async () => agentResults.getScreenshots },
    'src/modules/agent/agent.monitorSettings.service.js': {
      getPublicSettings: async () => settings,
      saveSettings: async () => settings,
      testSettings: async () => true,
      getUsbControlConfig: async () => agentResults.getUsbControlConfig,
    },
    'src/modules/agent/agent.monitorUploads.service.js': {
      createUploadSession: async () => agentResults.createUploadSession,
      completeUploadSession: async () => agentResults.completeUploadSession,
    },
    'src/modules/agent/agent.health.service.js': { saveHealth: async () => agentResults.saveHealth },
    'src/modules/monitorUpdates/monitorUpdates.service.js': {
      listReleases: service.listReleases,
      createRelease: service.createRelease,
      activateRelease: service.activateRelease,
      getLatestRelease: service.getLatestRelease,
      recordUpdateStatus: service.recordUpdateStatus,
    },
  },
});

test('agent 16 routes and monitor update 5 routes preserve V1 status/body, auth, validation, and injected-provider responses', async t => {
  const server = legacy.listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const app = Fastify({logger:false});
  const authenticate = async request => { request.user = identity; };
  await registerAgentRoutes(app,{service,authenticate,authorize:async () => permitAgent ? null : deny});
  await registerMonitorUpdateRoutes(app,{service,authenticate});
  await app.ready();
  t.after(async () => { await app.close(); await new Promise(resolve => server.close(resolve)); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const request = async (method,path,payload,headers={}) => {
    const legacyResponse = await fetch(`${origin}${path}`,{method,headers:{...(payload===undefined?{}:{'content-type':'application/json'}),...headers},...(payload===undefined?{}:{body:JSON.stringify(payload)})});
    const v2Response = await app.inject({method,url:`/api/v2${path.replace('/api/v1','')}`,headers,payload});
    return { legacy:{status:legacyResponse.status,body:await legacyResponse.json()},v2:{status:v2Response.statusCode,body:v2Response.json()} };
  };

  let deniedCount = 0;
  for (const [method,path] of routeCalls) {
    const result = await request(method,`/api/v1/agents${path}`,method === 'GET' ? undefined : agentRequest(method,path));
    assert.equal(result.v2.status,result.legacy.status,`${method} ${path} auth status`);
    assert.deepEqual(result.v2.body,result.legacy.body,`${method} ${path} auth body`);
    deniedCount += 1;
  }
  assert.equal(deniedCount,16);

  permitAgent = true;
  let successCount = 0;
  for (const [method,path] of routeCalls) {
    const result = await request(method,`/api/v1/agents${path}`,method === 'GET' ? undefined : agentRequest(method,path));
    assert.equal(result.v2.status,result.legacy.status,`${method} ${path} provider success status`);
    assert.deepEqual(result.v2.body,result.legacy.body,`${method} ${path} provider success body`);
    successCount += 1;
  }
  assert.equal(successCount,16);

  const monitorCalls = [
    ['GET','/releases'],['POST','/releases',{version:'2.0.0',fileBase64:'eA=='}],
    ['PATCH','/releases/release-1',{status:'active',rolloutPercentage:35}],
    ['GET','/update/latest',undefined,{'x-device-id':'device-1','x-app-version':'1.0.0'}],
    ['POST','/update/status',{deviceId:'device-1',status:'UPDATED'}],
  ];
  for (const [method,path,payload,headers] of monitorCalls) {
    const result = await request(method,`/api/v1/monitor${path}`,payload,headers);
    assert.equal(result.v2.status,result.legacy.status,`${method} monitor${path} status`);
    assert.deepEqual(result.v2.body,result.legacy.body,`${method} monitor${path} body`);
  }

  const badHealth = await request('POST','/api/v1/agents/health',{});
  assert.equal(badHealth.v2.status,badHealth.legacy.status);
  assert.deepEqual(badHealth.v2.body,badHealth.legacy.body);
  const badSettings = await request('PUT','/api/v1/agents/cloudinary',{});
  assert.equal(badSettings.v2.status,badSettings.legacy.status);
  assert.deepEqual(badSettings.v2.body,badSettings.legacy.body);
});
