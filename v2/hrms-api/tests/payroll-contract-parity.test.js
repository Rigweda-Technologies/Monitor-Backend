import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { payrollRouteDefinitions, payrollResponseMessages, registerPayrollRoutes } from '../src/modules/payroll/payroll.routes.js';
import { createPayrollRepository } from '../src/modules/payroll/payroll.repository.js';
import { createPayrollService } from '../src/modules/payroll/payroll.service.js';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const legacyPayroll = path.join(root, 'hrms/back-end/src/modules/payroll');
const responseData = { payrollEnabled: false, payrollCutoffDay: 25, payrollSalaryPayDay: 30 };
const testIdentity = { userId: 'parity-user', organizationId: 'parity-org' };
const listenExpress = app => new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
const listenFastify = app => app.listen({ port: 0, host: '127.0.0.1' });
const request = async (server, method, route, body) => {
  const base = typeof server === 'string' ? server : `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}${route}`, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
};
const routeUrl = route => route.replace(/:([A-Za-z0-9_]+)/g, (_match, name) => ({
  id: '507f1f77bcf86cd799439011', profileId: '507f1f77bcf86cd799439011', salaryStructureId: '507f1f77bcf86cd799439011',
  payGroupId: '00000000-0000-4000-8000-000000000001', runId: '00000000-0000-4000-8000-000000000002',
  ifscCode: 'HDFC0000001', employeeExternalId: 'employee-1',
}[name] || 'probe'));
const validationGroups = ['payrollApi','payrollApproval','payrollAttendance','payrollReports','payrollRun','payrollValidation','payslip'];
const validationParitySamples = [{}, null, 'invalid-root', { __parity_unknown_field__: true }];
const validationFieldSamples = description => {
  const values = description.type === 'string' ? [null,'','x','ab','unexpected','507f1f77bcf86cd799439011','00000000-0000-4000-8000-000000000001','2026-11-01T00:00:00.000Z']
    : description.type === 'number' ? [null,-1,0,1,31,100000]
      : description.type === 'boolean' ? [null,true,false,'true','false','invalid']
        : description.type === 'array' ? [null,[],['x'],[{}]]
          : description.type === 'object' ? [null,{}, {__parity_unknown_field__:true}]
            : description.type === 'date' ? [null,'2026-11-01','not-a-date'] : [null,'unexpected',0,{},[]];
  return values;
};
const fakeLegacyService = new Proxy({}, { get: () => async () => ({}) });
const legacyServiceStubs = {
  'src/modules/payroll/payrollApi.service.js': fakeLegacyService,
  'src/modules/payroll/payrollApproval.service.js': fakeLegacyService,
  'src/modules/payroll/payrollAttendance.service.js': fakeLegacyService,
  'src/modules/payroll/payrollRun.service.js': fakeLegacyService,
  'src/modules/payroll/payrollValidation.service.js': fakeLegacyService,
  'src/modules/payroll/payslip.service.js': fakeLegacyService,
  'src/modules/payroll/payrollIdempotency.service.js': { executeIdempotentPayrollAction: async ({ resolver }) => resolver() },
  'src/modules/payroll/payrollJob.service.js': { enqueuePayrollRunComputeJob: async () => ({ status: 'queued' }) },
};

test('all 53 payroll status/message contracts match their live V1 controllers', async () => {
  assert.equal(payrollRouteDefinitions.length, 53);
  const sourceFor = new Map([
    ['payrollApi.controller.js', await readFile(path.join(legacyPayroll, 'payrollApi.controller.js'), 'utf8')],
    ['payrollApproval.controller.js', await readFile(path.join(legacyPayroll, 'payrollApproval.controller.js'), 'utf8')],
    ['payrollAttendance.controller.js', await readFile(path.join(legacyPayroll, 'payrollAttendance.controller.js'), 'utf8')],
    ['payrollReports.controller.js', await readFile(path.join(legacyPayroll, 'payrollReports.controller.js'), 'utf8')],
    ['payrollRun.controller.js', await readFile(path.join(legacyPayroll, 'payrollRun.controller.js'), 'utf8')],
    ['payrollValidation.controller.js', await readFile(path.join(legacyPayroll, 'payrollValidation.controller.js'), 'utf8')],
    ['payslip.controller.js', await readFile(path.join(legacyPayroll, 'payslip.controller.js'), 'utf8')],
  ]);
  const controllerFile = operation => operation === 'computeRun' ? 'payrollRun.controller.js'
    : ['submitForApproval','approveRun','rejectRun','lockRun','reopenRun','listAuditEntries'].includes(operation) ? 'payrollApproval.controller.js'
      : ['generateMonthlySnapshots','listMonthlySnapshots'].includes(operation) ? 'payrollAttendance.controller.js'
        : ['payrollRegister','bankTransferExport','deductionSummary','employerContributionSummary','costCenterTotals'].includes(operation) ? 'payrollReports.controller.js'
          : ['getPayslipByRun','getPayslipByMonth','getMyPayslipByMonth','listMyPayslipMonths','listMyPayslipRuns','getMyPayslipByRun'].includes(operation) ? 'payslip.controller.js'
            : operation === 'validateRun' ? 'payrollValidation.controller.js' : 'payrollApi.controller.js';
  for (const route of payrollRouteDefinitions) {
    const source = sourceFor.get(controllerFile(route.operation));
    const start = source.indexOf(`exports.${route.operation} =`);
    assert.notEqual(start, -1, `${route.operation} controller missing in V1`);
    const end = source.indexOf('\nexports.', start + 1);
    const block = source.slice(start, end === -1 ? source.length : end);
    const status = block.match(/res\.status\(([^)]+)\)/)?.[1];
    if (['computeRun','recomputeRun'].includes(route.operation)) {
      assert.match(status || '', /statusCode|asyncRequested/);
      assert.equal(route.status, 200);
      assert.ok(route.operation in payrollResponseMessages);
    } else {
      assert.equal(Number(status), route.status, `${route.method} ${route.path} status mismatch`);
      const legacyMessage = block.match(/message:\s*"([^"]+)"/)?.[1];
      assert.equal(payrollResponseMessages[route.operation], legacyMessage, `${route.operation} message mismatch`);
    }
  }
});

test('payroll Joi validators match V1 outcomes across every module schema', () => {
  const compareValidation=(legacySchema,migratedSchema,input,label)=>{
    const left=legacySchema.validate(input,{abortEarly:true});
    const right=migratedSchema.validate(input,{abortEarly:true});
    assert.equal(right.error?.details?.[0]?.type,left.error?.details?.[0]?.type,`${label} error type`);
    assert.equal(right.error?.details?.[0]?.message,left.error?.details?.[0]?.message,`${label} error message`);
    assert.deepEqual(right.error?.details?.[0]?.path,left.error?.details?.[0]?.path,`${label} error path`);
    if(!left.error)assert.deepEqual(right.value,left.value,`${label} normalized value`);
  };
  for (const group of validationGroups) {
    const v1 = require(path.join(legacyPayroll, `${group}.validation.js`));
    const v2 = require(`../src/modules/payroll/${group}.validation.cjs`);
    for (const [name, legacySchema] of Object.entries(v1)) {
      if (!v2[name]?.validate) continue;
      for (const sample of validationParitySamples) {
        const input = sample === null ? {} : sample;
        compareValidation(legacySchema,v2[name],input,`${group}.${name}`);
      }
      const description=legacySchema.describe();
      for(const [key,field] of Object.entries(description.keys||{})){
        for(const value of validationFieldSamples(field))compareValidation(legacySchema,v2[name],{[key]:value},`${group}.${name}.${key}=${JSON.stringify(value)}`);
        for(const [nestedKey,nestedField] of Object.entries(field.keys||{})){
          for(const value of validationFieldSamples(nestedField))compareValidation(legacySchema,v2[name],{[key]:{[nestedKey]:value}},`${group}.${name}.${key}.${nestedKey}=${JSON.stringify(value)}`);
        }
      }
    }
  }
});

test('all route permission failures match the V1 authorization gate', async t => {
  const v1Permissions = [];
  const v1App = createLegacyRouterHarness({
    mounts: [{ path: '/api/v1/payroll', modulePath: 'src/modules/payroll/payrollAttendance.routes.js' }],
    identity: testIdentity,
    overrides: {
      ...legacyServiceStubs,
      'src/modules/payroll/payrollReports.service.js': fakeLegacyService,
      'src/middlewares/authorize.middleware.js': permission => (_req, res) => {
        v1Permissions.push(permission);
        const label = Array.isArray(permission) ? permission.join(' | ') : permission;
        return res.status(403).json({ success: false, code: 403, message: `Permission denied: ${label}`, data: null, error: null });
      },
    },
  });
  const v1Server = await listenExpress(v1App);
  t.after(() => v1Server.close());
  const v2Permissions = [];
  const v2 = Fastify({ logger: false });
  t.after(() => v2.close());
  const service = Object.fromEntries([...new Set(payrollRouteDefinitions.map(route => route.operation))].map(name => [name, async () => { throw new Error('permission gate did not stop request'); }]));
  await registerPayrollRoutes(v2, {
    service,
    authenticate: async request => { request.user = { ...testIdentity }; },
    authorize: async permission => {
      v2Permissions.push(permission);
      const label = Array.isArray(permission) ? permission.join(' | ') : permission;
      return { code: 403, message: `Permission denied: ${label}` };
    },
  });
  await v2.ready();
  const v2Server = await listenFastify(v2);
  for (const route of payrollRouteDefinitions) {
    const pathPart = routeUrl(route.path);
    const legacy = await request(v1Server, route.method, `/api/v1/payroll${pathPart}`, ['POST','PUT'].includes(route.method) ? {} : undefined);
    const migrated = await request(v2Server, route.method, `/api/v2/payroll${pathPart}`, ['POST','PUT'].includes(route.method) ? {} : undefined);
    assert.equal(legacy.status, 403, `${route.method} ${route.path} V1`);
    assert.equal(migrated.status, 403, `${route.method} ${route.path} V2`);
    assert.deepEqual(migrated.body, legacy.body, `${route.method} ${route.path} failure envelope`);
  }
  const permissionList = value => Array.isArray(value) ? value : [value];
  assert.deepEqual(v2Permissions.map(permissionList), v1Permissions.map(permissionList));
  assert.equal(v1Permissions.length, 53);
});

test('V1 and V2 create-pay-group success and validation envelopes match', async t => {
  const fixture = { code: 'ops_monthly', name: 'Ops Monthly', payFrequency: 'monthly', salaryPayDay: 30 };
  const v1App = createLegacyRouterHarness({
    mounts: [{ path: '/api/v1/payroll', modulePath: 'src/modules/payroll/payrollAttendance.routes.js' }],
    identity: testIdentity,
    overrides: {
      ...legacyServiceStubs,
      'src/modules/payroll/payrollReports.service.js': fakeLegacyService,
      'src/modules/payroll/payrollApi.service.js': { createPayGroup: async req => req.body },
    },
  });
  const v1Server = await listenExpress(v1App);
  t.after(() => v1Server.close());
  const v2 = Fastify({ logger: false });
  t.after(() => v2.close());
  const service = Object.fromEntries([...new Set(payrollRouteDefinitions.map(route => route.operation))].map(name => [name, async () => null]));
  service.createPayGroup = async req => req.body;
  await registerPayrollRoutes(v2, { service, authenticate: async req => { req.user = { ...testIdentity }; }, authorize: async () => null });
  await v2.ready();
  const v2Server = await listenFastify(v2);

  const legacyCreated = await request(v1Server, 'POST', '/api/v1/payroll/pay-groups', fixture);
  const migratedCreated = await request(v2Server, 'POST', '/api/v2/payroll/pay-groups', fixture);
  assert.equal(legacyCreated.status, 201);
  assert.deepEqual(migratedCreated, legacyCreated);
  assert.deepEqual(legacyCreated.body, { success: true, code: 200, message: 'Pay group created successfully', data: { ...fixture, code: 'OPS_MONTHLY', workWeekDays: 6, isActive: true, metadata: {} }, error: null });

  const legacyInvalid = await request(v1Server, 'POST', '/api/v1/payroll/pay-groups', {});
  const migratedInvalid = await request(v2Server, 'POST', '/api/v2/payroll/pay-groups', {});
  assert.equal(legacyInvalid.status, 406);
  assert.deepEqual(migratedInvalid, legacyInvalid);
});

test('V1 and V2 synchronous and queued payroll compute preserve 200/202 contracts', async t => {
  const v1App = createLegacyRouterHarness({
    mounts: [{ path: '/api/v1/payroll', modulePath: 'src/modules/payroll/payrollAttendance.routes.js' }],
    identity: testIdentity,
    overrides: {
      ...legacyServiceStubs,
      'src/modules/payroll/payrollReports.service.js': fakeLegacyService,
      'src/modules/payroll/payrollRun.service.js': { computePayrollRun: async () => ({ status: 'computed' }) },
      'src/modules/payroll/payrollJob.service.js': { enqueuePayrollRunComputeJob: async () => ({ status: 'queued' }) },
    },
  });
  const v1Server = await listenExpress(v1App);
  t.after(() => v1Server.close());
  const v2 = Fastify({ logger: false });
  t.after(() => v2.close());
  const service = Object.fromEntries([...new Set(payrollRouteDefinitions.map(route => route.operation))].map(name => [name, async () => null]));
  service.asyncComputeDefault = false;
  service.executeAction = async ({ request: req }) => ({ status: req.body.async ? 'queued' : 'computed' });
  await registerPayrollRoutes(v2, { service, authenticate: async req => { req.user = { ...testIdentity }; }, authorize: async () => null });
  await v2.ready();
  const v2Server = await listenFastify(v2);
  for (const [async, expectedStatus, expectedMessage] of [
    [false, 200, 'Payroll run computed successfully'],
    [true, 202, 'Payroll run queued for async compute'],
  ]) {
    const payload = { async };
    const v1 = await request(v1Server, 'POST', '/api/v1/payroll/runs/00000000-0000-4000-8000-000000000002/compute', payload);
    const v2Result = await request(v2Server, 'POST', '/api/v2/payroll/runs/00000000-0000-4000-8000-000000000002/compute', payload);
    assert.deepEqual(v2Result, v1);
    assert.equal(v1.status, expectedStatus);
    assert.equal(v1.body.message, expectedMessage);
  }
});

test('V1 and V2 payroll report fixtures preserve totals, CSV, envelopes, and HTTP statuses', async t => {
  const tenantId = 'tenant-1';
  const runs = [{ id: '00000000-0000-4000-8000-000000000002', run_code: 'RUN-2026-06', run_name: 'June', pay_month: '2026-06', pay_group_id: 'group-1', status: 'approved', currency_code: 'INR' }];
  const registerRows = [
    { payroll_run_id: runs[0].id, run_code: runs[0].run_code, pay_month: '2026-06', employee_external_id: 'employee-1', employee_code: 'E-001', cost_center_code: 'Ops', payable_days: 30, lop_days: 0, overtime_minutes: 60, gross_earnings: '50000.00', total_deductions: '5000.00', reimbursement_amount: '250.50', employer_contributions: '1800.00', net_pay: '45250.50', payroll_status: 'paid' },
    { payroll_run_id: runs[0].id, run_code: runs[0].run_code, pay_month: '2026-06', employee_external_id: 'employee-2', employee_code: 'E-002', cost_center_code: 'Ops', payable_days: 28, lop_days: 2, overtime_minutes: 0, gross_earnings: '40000.10', total_deductions: '4000.00', reimbursement_amount: '0', employer_contributions: '1500.00', net_pay: '36000.10', payroll_status: 'paid' },
  ];
  const transferRows = [
    { run_code: 'RUN-2026-06', pay_month: '2026-06', employee_external_id: 'employee-1', employee_code: 'E-001', account_holder_name: 'A. One', bank_name: 'Example Bank', account_number: '001234', ifsc_code: 'HDFC0000001', payment_mode: 'bank_transfer', upi_id: '', transfer_amount: '45250.50' },
    { run_code: 'RUN-2026-06', pay_month: '2026-06', employee_external_id: 'employee-2', employee_code: 'E-002', account_holder_name: 'B, Two', bank_name: 'Example Bank', account_number: '009876', ifsc_code: 'HDFC0000002', payment_mode: 'bank_transfer', upi_id: '', transfer_amount: '36000.10' },
  ];
  const queryFixture = sql => {
    if (sql.includes('SELECT id FROM payroll_tenants')) return [{ id: tenantId }];
    if (sql.includes('SELECT id, run_code, run_name')) return runs;
    if (sql.includes('transfer_amount')) return transferRows;
    if (sql.includes('re.payroll_run_id')) return registerRows;
    throw new Error(`Unrecognized payroll report fixture query: ${sql.slice(0, 100)}`);
  };
  const fakePool = { async connect() { return { query: async sql => ({ rows: queryFixture(sql) }), release() {} }; } };
  const legacyServiceOverrides = {
    ...legacyServiceStubs,
    'src/config/payrollDb.js': { getPayrollPgPool: async () => fakePool },
    'src/modules/payroll/payrollProvisioning.service.js': { getTenantIdForOrganization: async () => tenantId },
  };
  const v1App = createLegacyRouterHarness({
    mounts: [{ path: '/api/v1/payroll', modulePath: 'src/modules/payroll/payrollAttendance.routes.js' }],
    identity: testIdentity,
    overrides: legacyServiceOverrides,
  });
  const v1Server = await listenExpress(v1App);
  t.after(() => v1Server.close());

  const prisma = {
    async $transaction(work) {
      const tx = {
        async $queryRawUnsafe(sql) { return queryFixture(sql); },
        async $executeRawUnsafe() { return 1; },
      };
      return work(tx);
    },
    async $queryRawUnsafe(sql) { return queryFixture(sql); },
    async $executeRawUnsafe() { return 1; },
  };
  const OrgSettings = { findOne: () => ({ select: () => ({ lean: async () => ({ payrollEnabled: true, timezone: 'Asia/Kolkata' }) }) }) };
  const payrollService = createPayrollService({ repository: createPayrollRepository({ prisma }), models: { OrgSettings } });
  const v2 = Fastify({ logger: false });
  t.after(() => v2.close());
  const routeService = Object.fromEntries([...new Set(payrollRouteDefinitions.map(route => route.operation))].map(name => [name, (...args) => payrollService[name](...args)]));
  routeService.executeAction = (...args) => payrollService.executeAction(...args);
  routeService.asyncComputeDefault = false;
  await registerPayrollRoutes(v2, { service: routeService, authenticate: async request => { request.user = { ...testIdentity }; }, authorize: async () => null });
  await v2.ready();
  const v2Server = await listenFastify(v2);

  for (const [query, pathPart] of [
    ['month=2026-06', '/reports/payroll-register?month=2026-06'],
    ['month=2026-06&exportFormat=csv', '/reports/bank-transfer-export?month=2026-06&exportFormat=csv'],
  ]) {
    const [endpoint] = query.split('&');
    const legacy = await request(v1Server, 'GET', `/api/v1/payroll${pathPart}`);
    const migrated = await request(v2Server, 'GET', `/api/v2/payroll${pathPart}`);
    assert.equal(migrated.status, legacy.status);
    assert.deepEqual(migrated.body, legacy.body);
    assert.equal(legacy.body.success, true);
    assert.equal(legacy.body.code, 200);
    assert.equal(legacy.body.error, null);
    if (endpoint === 'month=2026-06' && pathPart.includes('register')) {
      assert.deepEqual(legacy.body.data.totals, { gross: 90000.1, deductions: 9000, reimbursements: 250.5, employerContributions: 3300, netPay: 81250.6 });
    } else {
      assert.equal(legacy.body.data.transferTotal, 81250.6);
      assert.match(legacy.body.data.csv, /"B, Two"/);
    }
  }
});
