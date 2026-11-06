import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { registerOrgSettingsRoutes } from '../src/modules/org-settings/org-settings.routes.js';
import { createOrgSettingsService } from '../src/modules/org-settings/org-settings.service.js';

const build = async ({ service, authorize = async () => null, user = { userId: 'u', organizationId: 'o' } }) => {
  const app = Fastify({ logger: false, routerOptions: { ignoreTrailingSlash: true } });
  await app.register(swagger, { openapi: { info: { title: 'test', version: '1.0.0' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } } });
  await registerOrgSettingsRoutes(app, { service, authenticate: async request => { request.user = user; }, authorize });
  return app;
};

test('organization settings exposes four documented routes with v1 permissions and envelopes', async t => {
  const calls = [];
  const service = Object.fromEntries(['get','upsert','getTheme','updateTheme'].map(key => [key, async () => { calls.push(key); return { key }; }]));
  const permissions = [];
  const app = await build({ service, authorize: async permission => { permissions.push(permission); return null; } });
  t.after(() => app.close());
  const routes = [['GET','/api/v2/org-settings/'],['POST','/api/v2/org-settings/'],['GET','/api/v2/org-settings/theme'],['POST','/api/v2/org-settings/theme']];
  await app.ready();
  const openapi = app.swagger().paths;
  assert.ok(openapi['/api/v2/org-settings/'].get && openapi['/api/v2/org-settings/'].post);
  assert.ok(openapi['/api/v2/org-settings/theme'].get && openapi['/api/v2/org-settings/theme'].post);
  const headers = { authorization: 'Bearer token' };
  const get = await app.inject({ method: 'GET', url: '/api/v2/org-settings/', headers });
  assert.equal(get.statusCode, 200);
  assert.deepEqual(get.json(), { success: true, code: 200, message: 'Success', data: { key: 'get' }, error: null });
  const upsert = await app.inject({ method: 'POST', url: '/api/v2/org-settings/', headers, payload: {
    leaveCreditFrequency: 'monthly', leaveTypeCreditMode: 'current_month_onwards', timezone: 'Asia/Kolkata', minWorkHoursPerDay: 8, minHalfDayHours: 4,
  } });
  assert.equal(upsert.statusCode, 200);
  assert.equal(upsert.json().message, 'Organization settings saved');
  const theme = await app.inject({ method: 'GET', url: '/api/v2/org-settings/theme', headers });
  assert.equal(theme.statusCode, 200);
  const saveTheme = await app.inject({ method: 'POST', url: '/api/v2/org-settings/theme', headers, payload: { themeMode: 'preset', themePreset: 'ocean', themeConfig: {} } });
  assert.equal(saveTheme.statusCode, 200);
  assert.equal(saveTheme.json().message, 'Organization theme saved');
  assert.deepEqual(permissions, ['ORG_SETTINGS_VIEW', 'ORG_SETTINGS_MANAGE', 'ORG_SETTINGS_MANAGE']);
  assert.deepEqual(calls, ['get','upsert','getTheme','updateTheme']);
  assert.ok(app.swagger().paths['/api/v2/org-settings/theme'].get);
});

test('settings validation rejects invalid timezone and conditional attendance requirements', async () => {
  const sideEffects = [];
  const models = {
    Organization: { findById: () => ({ select: async () => ({ timezone: 'Asia/Kolkata' }) }), findByIdAndUpdate: async (...args) => sideEffects.push(['org-update', ...args]) },
    OrgSettings: {
      findOne: () => ({ select: async () => null }),
      findOneAndUpdate: async (...args) => { sideEffects.push(['settings-update', ...args]); return { ...args[1], toObject() { return this; } }; },
    },
  };
  const service = createOrgSettingsService(models, { uploadDataUri: async () => ({ secure_url: 'logo' }), ensurePayrollTenantAndDefaults: async () => {} });
  const request = { user: { organizationId: 'o', userId: 'u' }, body: { timezone: 'Mars/Olympus', attendanceIpEnabled: true, attendanceAllowedIp: '', minWorkHoursPerDay: 8 } };
  await assert.rejects(service.upsert(request), /Invalid timezone/);
  assert.equal(sideEffects.length, 0);
  request.body = { timezone: 'Asia/Kolkata', attendanceIpEnabled: true, attendanceAllowedIp: '', minWorkHoursPerDay: 8 };
  await assert.rejects(service.upsert(request), /Allowed office IP is required/);
  request.body = { timezone: 'Asia/Kolkata', attendanceGeoFenceEnabled: true, attendanceGeoLatitude: null, attendanceGeoLongitude: 77, minWorkHoursPerDay: 8 };
  await assert.rejects(service.upsert(request), /Office latitude and longitude are required/);
  assert.equal(sideEffects.length, 0);
});

test('settings save injects logo and payroll providers and scopes writes to authenticated organization', async () => {
  const effects = [];
  const settings = { payrollEnabled: true, toObject() { return { payrollEnabled: true }; } };
  const models = {
    Organization: { findById: () => ({ select: () => ({ lean: async () => ({ name: 'Org' }) }) }), findByIdAndUpdate: async (...args) => effects.push(['organization', ...args]) },
    OrgSettings: { findOne: () => ({ select: async () => ({ logoUrl: 'old-logo', themeMode: 'preset', themePreset: 'ocean', themeConfig: {} }) }), findOneAndUpdate: async (...args) => { effects.push(['settings', ...args]); return settings; } },
  };
  const service = createOrgSettingsService(models, {
    uploadDataUri: async (...args) => { effects.push(['upload', ...args]); return { secure_url: 'new-logo' }; },
    ensurePayrollTenantAndDefaults: async args => effects.push(['payroll', args]),
  });
  const request = { user: { userId: 'actor', organizationId: '507f1f77bcf86cd799439011' }, body: { timezone: 'Asia/Kolkata', leaveCreditFrequency: 'monthly', leaveTypeCreditMode: 'current_month_onwards', minWorkHoursPerDay: 8, minHalfDayHours: 4, logoUpload: { mimeType: 'image/png', base64Data: 'eA==' }, payrollEnabled: true } };
  const result = await service.upsert(request);
  assert.equal(result.organizationName, 'Org');
  assert.equal(effects.find(([name]) => name === 'upload')[1], 'data:image/png;base64,eA==');
  assert.deepEqual(effects.find(([name]) => name === 'organization').slice(1), ['507f1f77bcf86cd799439011', { timezone: 'Asia/Kolkata' }]);
  assert.equal(effects.find(([name]) => name === 'payroll')[1].actorId, 'actor');
});
