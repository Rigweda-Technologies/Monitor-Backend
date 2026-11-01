import { createRequire } from 'node:module';
import { withPayrollContext } from './legacy/context.cjs';
import { httpError } from '../../plugins/errors.js';
import { createPayrollRepository } from './payroll.repository.js';

const require = createRequire(import.meta.url);
const api = require('./legacy/payrollApi.service.cjs');
const approval = require('./legacy/payrollApproval.service.cjs');
const attendance = require('./legacy/payrollAttendance.service.cjs');
const idempotency = require('./legacy/payrollIdempotency.service.cjs');
const jobs = require('./legacy/payrollJob.service.cjs');
const provisioning = require('./legacy/payrollProvisioning.service.cjs');
const reports = require('./legacy/payrollReports.service.cjs');
const runs = require('./legacy/payrollRun.service.cjs');
const validation = require('./legacy/payrollValidation.service.cjs');
const payslips = require('./legacy/payslip.service.cjs');

const operations = {
  getSettings: api.getSettings,
  listPayGroups: api.listPayGroups,
  getPayGroup: api.getPayGroup,
  createPayGroup: api.createPayGroup,
  updatePayGroup: api.updatePayGroup,
  archivePayGroup: api.archivePayGroup,
  upsertSettings: api.upsertSettings,
  getPayrollSetupBootstrap: api.getPayrollSetupBootstrap,
  savePayrollSetup: api.savePayrollSetup,
  createSalaryComponent: api.createSalaryComponent,
  listSalaryComponents: api.listSalaryComponents,
  getSalaryComponentById: api.getSalaryComponentById,
  updateSalaryComponent: api.updateSalaryComponent,
  deleteSalaryComponent: api.deleteSalaryComponent,
  createEmployeeProfile: api.createEmployeeProfile,
  listEmployeeProfiles: api.listEmployeeProfiles,
  lookupBankByAccount: api.lookupBankByAccount,
  lookupBankByIfsc: api.lookupBankByIfsc,
  getEmployeeProfile: api.getEmployeeProfile,
  updateEmployeeProfile: api.updateEmployeeProfile,
  deleteEmployeeProfile: api.deleteEmployeeProfile,
  upsertBankDetail: api.upsertBankDetail,
  upsertStatutoryDetail: api.upsertStatutoryDetail,
  createSalaryStructure: api.createSalaryStructure,
  updateSalaryStructure: api.updateSalaryStructure,
  deleteSalaryStructure: api.deleteSalaryStructure,
  createRun: api.createPayrollRun,
  listRuns: api.listPayrollRuns,
  getRun: api.getPayrollRun,
  previewRun: api.previewPayrollRun,
  getRunEmployeeBreakdown: api.getRunEmployeeBreakdown,
  generateMonthlySnapshots: attendance.generateMonthlyAttendanceSnapshots,
  listMonthlySnapshots: attendance.listMonthlyAttendanceSnapshots,
  computeRun: runs.computePayrollRun,
  recomputeRun: runs.computePayrollRun,
  submitForApproval: approval.submitForApproval,
  approveRun: approval.approveRun,
  rejectRun: approval.rejectRun,
  lockRun: approval.lockRun,
  reopenRun: approval.reopenRun,
  listAuditEntries: approval.listRunAuditEntries,
  getPayslipByRun: payslips.getPayslipByRun,
  getPayslipByMonth: payslips.getPayslipByMonth,
  getMyPayslipByMonth: payslips.getMyPayslipByMonth,
  listMyPayslipMonths: payslips.listMyPayslipMonths,
  listMyPayslipRuns: payslips.listMyPayslipRuns,
  getMyPayslipByRun: payslips.getMyPayslipByRun,
  payrollRegister: reports.getPayrollRegister,
  bankTransferExport: reports.getBankTransferExport,
  deductionSummary: reports.getDeductionSummary,
  employerContributionSummary: reports.getEmployerContributionSummary,
  costCenterTotals: reports.getCostCenterTotals,
  validateRun: validation.validatePayrollRun,
};

const idempotencyActions = {
  createRun: 'payroll_run_create',
  computeRun: 'payroll_run_compute',
  recomputeRun: 'payroll_run_recompute',
  submitForApproval: 'payroll_run_submit',
  approveRun: 'payroll_run_approve',
  rejectRun: 'payroll_run_reject',
  lockRun: 'payroll_run_lock',
  reopenRun: 'payroll_run_reopen',
};

// Express 5 exposes req.query as read-only. The V1 monthly self-service
// payslip operation reassigns it, so that assignment is ignored there.
const emulateExpressReadOnlyQuery = request => {
  const legacyRequest = Object.create(request);
  Object.defineProperty(legacyRequest, 'query', {
    enumerable: true,
    get: () => request.query,
    set: () => {},
  });
  return legacyRequest;
};

export const createPayrollService = ({ repository, monitorRepository = null, models = {}, queue = null, config = {}, asyncComputeDefault }) => {
  if (!repository || typeof repository.transaction !== 'function') throw new TypeError('Payroll repository with Prisma transactions is required.');
  const context = { models, monitor: monitorRepository?.$transaction ? createPayrollRepository({ prisma: monitorRepository }) : monitorRepository, queue };
  const payrollOptions = { ...(config.payroll || {}), ...(config.payrollOptions || {}) };
  if (asyncComputeDefault !== undefined) payrollOptions.computeAsyncDefault = Boolean(asyncComputeDefault);
  context.payrollOptions = payrollOptions;
  const execute = (operation, request) => repository.transaction(async transaction => {
    const transactionContext = { ...context, payroll: transaction };
    try {
      const value = await withPayrollContext(transactionContext, async () => {
        request.path ||= request.url?.split('?')[0];
        request.originalUrl ||= request.url;
        request.method ||= request.routeOptions?.method;
        const value = await operation(request);
        if (value && typeof value === 'object' && value.filters && request.payrollOriginalQuery) value.filters = request.payrollOriginalQuery;
        return value;
      });
      if (transactionContext.rollbackOnly) throw httpError(500, 'Payroll transaction was rolled back.');
      return value;
    } catch (error) {
      // Preserve the existing V1 API contract for the known migrated-schema
      // conflict-target failure until V1 changes that behavior.
      if ((error?.code === 'P2010' && String(error?.meta?.code) === '42P10') || /42P10|no unique or exclusion constraint matching the ON CONFLICT specification/i.test(String(error?.message || ''))) throw httpError(500,error.message);
      if (Number.isInteger(error?.code) && error?.message && !error.publicMessage) throw httpError(error.code, error.message);
      throw error;
    }
  });
  const service = Object.fromEntries(Object.entries(operations).map(([name, operation]) => [name, request => execute(
    operation,
    name === 'getMyPayslipByMonth' ? emulateExpressReadOnlyQuery(request) : request,
  )]));
  service.processPayrollRunComputeJob = job => {
    const data = job?.data || {};
    const request = {
      params: { runId: String(data.runId || '') },
      body: { ...(data.body || {}), _executionMode: 'async_job' },
      user: { ...(data.user || {}) },
      headers: data.idempotencyKey ? { 'idempotency-key': String(data.idempotencyKey) } : {},
    };
    return execute(() => jobs.processPayrollRunComputeJob(job), request);
  };

  service.executeAction = async ({ operation, request }) => {
    const actionKey = idempotencyActions[operation];
    if (!actionKey) throw new TypeError(`No idempotency action is defined for ${operation}.`);
    request.path ||= request.url?.split('?')[0];
    request.originalUrl ||= request.url;
    request.method ||= request.routeOptions?.method;
  const asyncRequested = operation === 'computeRun' || operation === 'recomputeRun'
      ? request.body?.async === true || payrollOptions.computeAsyncDefault === true
      : false;
    if (operation === 'recomputeRun') request.body = { ...(request.body || {}), forceRecompute: true };
    if ((operation === 'computeRun' || operation === 'recomputeRun') && !asyncRequested) {
      request.body = { ...(request.body || {}), _executionMode: 'sync' };
    }
    const resolver = async () => {
      if (asyncRequested) return jobs.enqueuePayrollRunComputeJob(request);
      return operations[operation](request);
    };
    try {
      return await withPayrollContext({ ...context, payroll: repository }, () => idempotency.executeIdempotentPayrollAction({
        req: request,
        actionKey,
        runId: request.params?.runId || null,
        resolver: () => execute(resolver, request),
      }));
    } catch (error) {
      if (Number.isInteger(error?.code) && error?.message && !error.publicMessage) throw httpError(error.code, error.message);
      throw error;
    }
  };
  service.asyncComputeDefault = payrollOptions.computeAsyncDefault === true;
  service.ensurePayrollTenantAndDefaults = input => repository.transaction(async transaction => {
    const transactionContext = { ...context, payroll: transaction };
    try {
      const result = await withPayrollContext(transactionContext, () => provisioning.ensurePayrollTenantAndDefaults({
        ...input,
        client: { query: transaction.query, execute: transaction.execute, release() {} },
      }));
      if (transactionContext.rollbackOnly) throw httpError(500, 'Payroll transaction was rolled back.');
      return result;
    } catch (error) {
      if (Number.isInteger(error?.code) && error?.message && !error.publicMessage) throw httpError(error.code, error.message);
      throw error;
    }
  });
  return service;
};

export const payrollOperationNames = Object.freeze(Object.keys(operations));
