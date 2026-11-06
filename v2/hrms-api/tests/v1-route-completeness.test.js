import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

const manifest = JSON.parse(await readFile(new URL('./fixtures/v1-api-route-manifest.json', import.meta.url), 'utf8'));
const ledger = JSON.parse(await readFile(new URL('./fixtures/v1-api-migration-ledger.json', import.meta.url), 'utf8'));
const config = loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_route_test', JWT_SECRET: 'route-coverage-test-secret-not-for-runtime' });
const service = new Proxy({}, { get: (_target, name) => name === 'listPermissions' ? async () => [] : async () => ({}) });
const canonical = path => (path.length > 1 ? path.replace(/\/$/, '') : path).replace(/:([A-Za-z0-9_]+)/g, '{$1}');

test('every unique mounted v1 operation is registered in v2 and documented in OpenAPI', async t => {
  const uniqueManifest = [...new Map(manifest.endpoints.map(route => [`${route.method} ${canonical(route.v1Path)}`, route])).values()];
  assert.equal(ledger.operations.length, uniqueManifest.length, 'migration ledger must contain one row per unique v1 operation');
  const ledgerByOperation = new Map(ledger.operations.map(row => [`${row.method} ${canonical(row.v1Path)}`, row]));
  assert.deepEqual([...ledgerByOperation.keys()].sort(), uniqueManifest.map(row => `${row.method} ${canonical(row.v1Path)}`).sort(), 'migration ledger operation keys must match the v1 manifest');
  for (const source of uniqueManifest) {
    const row = ledgerByOperation.get(`${source.method} ${canonical(source.v1Path)}`);
    assert.equal(row.v2Path, source.v2Path, `ledger V2 path drift for ${source.method} ${source.v1Path}`);
    assert.equal(row.v1Source, source.source, `ledger V1 source drift for ${source.method} ${source.v1Path}`);
    assert.ok(row.v2RouteFile.startsWith('src/modules/'), `V2 route file missing for ${source.method} ${source.v1Path}`);
    assert.ok(row.testFiles.length > 0, `test reference missing for ${source.method} ${source.v1Path}`);
    assert.ok(row.testFiles.every(file => file.startsWith('tests/')), `invalid test reference for ${source.method} ${source.v1Path}`);
    assert.ok(['parity-suite-reference', 'path-reference', 'test-reference', 'route-only'].includes(row.evidence), `invalid evidence status for ${source.method} ${source.v1Path}`);
    if (row.evidence === 'parity-suite-reference') {
      assert.match(row.evidenceScope, /inspect that suite to determine which behaviors actually execute/);
    } else {
      assert.equal(row.evidenceScope, 'Test file references a route path or module; this ledger does not establish that a behavioral assertion executed.', `missing evidence boundary for ${source.method} ${source.v1Path}`);
    }
  }
  const app = await buildApp({
    config, logger: false, authService: service, authenticate: async () => {}, authorize: async () => null, isReady: async () => {},
    departmentService: service, roleService: service, designationService: service, leaveTypeService: service, leaveService: service,
    activityService: service, holidayService: service, weekOffService: service, shiftService: service, approvalFlowService: service,
    leaveBalanceService: service, orgSettingsService: service, organizationDocumentService: service, notificationService: service,
    projectService: service, monitorUpdateService: service, employeeService: service, expenseService: service, hiringService: service,
    organizationService: service, userAdministrationService: service, agentService: service, dashboardService: service,
    timesheetService: service, payrollService: service,
  });
  t.after(() => app.close());
  const expected = new Map(manifest.endpoints.map(route => [`${route.method} ${canonical(route.v2Path)}`, route]));
  const registered = new Set(app.applicationRoutes.map(route => `${route.method} ${canonical(route.url)}`));
  const missingRoutes = [...expected.keys()].filter(operation => !registered.has(operation));
  assert.deepEqual(missingRoutes, [], `v1 routes missing from v2: ${missingRoutes.join(', ')}`);
  const operational = new Set(['GET /', 'GET /api/v2/health', 'GET /api/v2/ready']);
  const extraRoutes = [...registered].filter(operation => !expected.has(operation) && !operational.has(operation));
  assert.deepEqual(extraRoutes, [], `v2 has untracked business routes: ${extraRoutes.join(', ')}`);
  await app.ready();
  const openapi = Object.fromEntries(Object.entries(app.swagger().paths).map(([path, methods]) => [canonical(path), methods]));
  const missingDocs = [...expected.values()].filter(({ method, v2Path }) => !openapi[canonical(v2Path)]?.[method.toLowerCase()]);
  assert.deepEqual(missingDocs.map(route => `${route.method} ${route.v2Path}`), [], 'v2 routes missing from OpenAPI');
});
