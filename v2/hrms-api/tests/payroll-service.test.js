import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createPayrollService, payrollOperationNames } from '../src/modules/payroll/payroll.service.js';
import { payrollRouteDefinitions } from '../src/modules/payroll/payroll.routes.js';

const require = createRequire(import.meta.url);
const runRules = require('../src/modules/payroll/legacy/payrollRun.service.cjs').__test__;

test('every registered payroll route resolves to an implemented service operation', () => {
  const operations = new Set(payrollOperationNames);
  const missing = payrollRouteDefinitions.filter(route => !operations.has(route.operation));
  assert.deepEqual(missing.map(route => route.operation), []);
});

test('payroll service factory runs handlers inside Prisma transaction and injects Mongo models', async () => {
  const events = [];
  const repository = {
    async transaction(work) {
      events.push('begin');
      try { const result = await work({ query: async () => ({ rows: [], rowCount: 0 }), execute: async () => 0 }); events.push('commit'); return result; }
      catch (error) { events.push('rollback'); throw error; }
    },
  };
  const settings = { payrollEnabled: false, payrollCutoffDay: 25, payrollSalaryPayDay: 30 };
  const OrgSettings = { findOne: () => ({ select: () => ({ lean: async () => settings }) }) };
  const service = createPayrollService({ repository, models: { OrgSettings }, config: { payrollOptions: { computeAsyncDefault: true } } });
  assert.equal(service.asyncComputeDefault, true);
  const result = await service.getSettings({ user: { organizationId: 'org-1' } });
  assert.deepEqual(result, { payrollEnabled: false, payrollCutoffDay: 25, payrollSalaryPayDay: 30 });
  assert.deepEqual(events, ['begin','commit']);
  await assert.rejects(service.ensurePayrollTenantAndDefaults({ organizationId: 'org-1', orgSettings: { payrollEnabled: false } }), error => error.statusCode === 400);
});

test('payroll retains v1 rounding, progressive tax, proration, and formula rules', () => {
  assert.equal(runRules.roundAmount(12.5), 13);
  assert.equal(runRules.roundAmount(12.99, 'floor_rupee'), 12);
  assert.equal(runRules.roundAmount(12.345, 'exact'), 12.35);
  assert.equal(runRules.computeProgressiveTax(1_500_000, [
    { upto: 250_000, rate: 0 }, { upto: 500_000, rate: 5 },
    { upto: 1_000_000, rate: 20 }, { upto: null, rate: 30 },
  ]), 262_500);
  assert.equal(runRules.getPayrollProrationUnits({ salaryProrationRule: 'present_days_on_working_days', presentDays: 18, paidLeaveDays: 2, payableDays: 22 }), 20);
  assert.equal(runRules.getPayrollProrationUnits({ salaryProrationRule: 'calendar_days', presentDays: 18, paidLeaveDays: 2, payableDays: 22 }), 22);
  assert.equal(runRules.evaluateFormula('if(BASIC > 0, BASIC * 0.4, 0)', { BASIC: 1000 }), 400);
  assert.throws(() => runRules.evaluateFormula('process.exit(1)', {}), /Unknown variable/);
});
