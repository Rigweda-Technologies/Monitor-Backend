import Joi from 'joi';
import { failure, success, httpError } from '../../plugins/errors.js';
import attendanceValidation from './payrollAttendance.validation.cjs';
import runValidation from './payrollRun.validation.cjs';
import validationValidation from './payrollValidation.validation.cjs';
import apiValidation from './payrollApi.validation.cjs';
import approvalValidation from './payrollApproval.validation.cjs';
import payslipValidation from './payslip.validation.cjs';
import reportsValidation from './payrollReports.validation.cjs';

export const payrollResponseMessages = Object.freeze({ getSettings:'Payroll settings fetched successfully',listPayGroups:'Pay groups fetched successfully',getPayGroup:'Pay group fetched successfully',createPayGroup:'Pay group created successfully',updatePayGroup:'Pay group updated successfully',archivePayGroup:'Pay group archived successfully',upsertSettings:'Payroll settings saved successfully',getPayrollSetupBootstrap:'Payroll setup bootstrap fetched successfully',savePayrollSetup:'Payroll setup saved successfully',createSalaryComponent:'Salary component created successfully',listSalaryComponents:'Salary components fetched successfully',getSalaryComponentById:'Salary component fetched successfully',updateSalaryComponent:'Salary component updated successfully',deleteSalaryComponent:'Salary component archived successfully',createEmployeeProfile:'Employee payroll profile created successfully',listEmployeeProfiles:'Employee payroll profiles fetched successfully',lookupBankByAccount:'Bank details lookup by account completed',lookupBankByIfsc:'Bank details lookup by IFSC completed',getEmployeeProfile:'Employee payroll profile fetched successfully',updateEmployeeProfile:'Employee payroll profile updated successfully',deleteEmployeeProfile:'Employee payroll profile deleted successfully',upsertBankDetail:'Bank detail saved successfully',upsertStatutoryDetail:'Statutory detail saved successfully',createSalaryStructure:'Salary structure created successfully',updateSalaryStructure:'Salary structure updated successfully',deleteSalaryStructure:'Salary structure archived successfully',createRun:'Payroll run created successfully',listRuns:'Payroll runs fetched successfully',getRun:'Payroll run fetched successfully',previewRun:'Payroll run preview generated successfully',getRunEmployeeBreakdown:'Payroll employee breakdown fetched successfully',generateMonthlySnapshots:'Payroll attendance snapshots generated successfully',listMonthlySnapshots:'Payroll attendance snapshots fetched successfully',computeRun:'Payroll run computed successfully',recomputeRun:'Payroll run recomputed successfully',submitForApproval:'Payroll run submitted for approval',approveRun:'Payroll run approved successfully',rejectRun:'Payroll run rejected and moved back for correction',lockRun:'Payroll run locked successfully',reopenRun:'Payroll run reopened to draft',listAuditEntries:'Payroll run audit trail fetched successfully',getPayslipByRun:'Payslip generated successfully',getPayslipByMonth:'Monthly payslip fetched successfully',getMyPayslipByMonth:'Employee monthly payslip fetched successfully',listMyPayslipMonths:'Employee payslip months fetched successfully',listMyPayslipRuns:'Employee payslip runs fetched successfully',getMyPayslipByRun:'Employee run payslip fetched successfully',payrollRegister:'Payroll register generated successfully',bankTransferExport:'Bank transfer export generated successfully',deductionSummary:'Deduction summary generated successfully',employerContributionSummary:'Employer contribution summary generated successfully',costCenterTotals:'Cost center payroll totals generated successfully',validateRun:'Payroll run validation completed' });

const response = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} } };
const joiSchema = schema => {
  const describe = schema?.describe?.();
  if (!describe) return {};
  const rules = Object.fromEntries((describe.rules || []).map(rule => [rule.name, rule.args || {}]));
  let result;
  if (describe.type === 'object') {
    const properties = {};
    const keysRequired = [];
    for (const [key, value] of Object.entries(describe.keys || {})) {
      const property = joiSchema({ describe: () => value });
      properties[key] = property;
      if (value.flags?.presence === 'required') keysRequired.push(key);
    }
    result = { type: 'object', properties, additionalProperties: Boolean(describe.flags?.unknown), ...(keysRequired.length ? { required: keysRequired } : {}) };
  } else if (describe.type === 'string') {
    result = { type: 'string' };
    if (rules.min?.limit !== undefined) result.minLength = rules.min.limit;
    if (rules.max?.limit !== undefined) result.maxLength = rules.max.limit;
    if (rules.length?.limit !== undefined) result.minLength = result.maxLength = rules.length.limit;
    if (rules.pattern?.regex) result.pattern = rules.pattern.regex.slice(1, rules.pattern.regex.lastIndexOf('/'));
    if (rules.email) result.format = 'email';
    if (rules.guid || rules.uuid) result.format = 'uuid';
    const allowed = (describe.allow || []).filter(value => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean');
    if (describe.flags?.only && allowed.length) result.enum = allowed;
  } else if (describe.type === 'number') {
    result = { type: 'number' };
    if (rules.min?.limit !== undefined) result.minimum = rules.min.limit;
    if (rules.max?.limit !== undefined) result.maximum = rules.max.limit;
    if (rules.integer) result.type = 'integer';
  } else if (describe.type === 'boolean') result = { type: 'boolean' };
  else if (describe.type === 'array') result = { type: 'array', items: joiSchema({ describe: () => describe.items?.[0] || { type: 'object' } }), ...(rules.min?.limit !== undefined ? { minItems: rules.min.limit } : {}), ...(rules.max?.limit !== undefined ? { maxItems: rules.max.limit } : {}) };
  else result = {};
  if (describe.flags?.default !== undefined) result.default = describe.flags.default;
  return result;
};
const validate = (schema, property = 'body') => async (request, reply) => {
  const { error, value } = schema.validate(request[property] ?? {}, { abortEarly: true });
  if (error) {
    const detail = error.details?.[0];
    let message = detail?.message || 'Validation failed';
    if (detail?.path?.length === 0 && detail?.type === 'any.required') message = property === 'body' ? 'Request body is required' : `Request ${property} is required`;
    return reply.code(406).send({ code: 406, message, data: null, error: [] });
  }
  request[property] = value;
};
const route = (method, path, permission, summary, operation, { params, query, body, status = 200, validation = [], idempotent = false } = {}) => ({ method, path, permission, summary, operation, params, query, body, status, validation, idempotent });
const sharedRunPermissions = ['PAYROLL_RUN_CREATE','PAYROLL_RUN_APPROVE','PAYROLL_RUN_LOCK','PAYROLL_REPORT_VIEW','PAYROLL_RUN_VIEW'];
const selfPermissions = ['EMP_SELF_VIEW','TIMESHEET_VIEW_SELF','LEAVE_VIEW_SELF'];
const manager = 'PAYROLL_CONFIG_MANAGE';
const routes = [
  route('GET','/settings',manager,'Get payroll settings','getSettings'),
  route('GET','/pay-groups',manager,'List pay groups','listPayGroups',{query:apiValidation.listPayGroupsQuerySchema,validation:[['query','listPayGroupsQuerySchema']]}),
  route('GET','/pay-groups/:payGroupId',manager,'Get a pay group','getPayGroup',{params:apiValidation.payGroupIdParamSchema,validation:[['params','payGroupIdParamSchema']]}),
  route('POST','/pay-groups',manager,'Create a pay group','createPayGroup',{body:apiValidation.createPayGroupSchema,status:201,validation:[['body','createPayGroupSchema']]}),
  route('PUT','/pay-groups/:payGroupId',manager,'Update a pay group','updatePayGroup',{params:apiValidation.payGroupIdParamSchema,body:apiValidation.updatePayGroupSchema,validation:[['params','payGroupIdParamSchema'],['body','updatePayGroupSchema']]}),
  route('DELETE','/pay-groups/:payGroupId',manager,'Archive a pay group','archivePayGroup',{params:apiValidation.payGroupIdParamSchema,validation:[['params','payGroupIdParamSchema']]}),
  route('PUT','/settings',manager,'Save payroll settings','upsertSettings',{body:apiValidation.updateSettingsSchema,validation:[['body','updateSettingsSchema']]}),
  route('GET','/setup/bootstrap',manager,'Get payroll setup bootstrap','getPayrollSetupBootstrap',{query:apiValidation.setupBootstrapQuerySchema,validation:[['query','setupBootstrapQuerySchema']]}),
  route('POST','/setup/save',manager,'Save payroll setup','savePayrollSetup',{body:apiValidation.bulkPayrollSetupSchema,validation:[['body','bulkPayrollSetupSchema']]}),
  route('POST','/salary-components',manager,'Create a salary component','createSalaryComponent',{body:apiValidation.createSalaryComponentSchema,status:201,validation:[['body','createSalaryComponentSchema']]}),
  route('GET','/salary-components',manager,'List salary components','listSalaryComponents',{query:apiValidation.listSalaryComponentsQuerySchema,validation:[['query','listSalaryComponentsQuerySchema']]}),
  route('GET','/salary-components/:id',manager,'Get a salary component','getSalaryComponentById',{params:apiValidation.componentIdParamSchema,query:apiValidation.componentScopeQuerySchema,validation:[['params','componentIdParamSchema'],['query','componentScopeQuerySchema']]}),
  route('PUT','/salary-components/:id',manager,'Update a salary component','updateSalaryComponent',{params:apiValidation.componentIdParamSchema,query:apiValidation.componentScopeQuerySchema,body:apiValidation.updateSalaryComponentSchema,validation:[['params','componentIdParamSchema'],['query','componentScopeQuerySchema'],['body','updateSalaryComponentSchema']]}),
  route('DELETE','/salary-components/:id',manager,'Delete a salary component','deleteSalaryComponent',{params:apiValidation.componentIdParamSchema,query:apiValidation.componentScopeQuerySchema,validation:[['params','componentIdParamSchema'],['query','componentScopeQuerySchema']]}),
  route('POST','/employee-profiles',manager,'Create an employee payroll profile','createEmployeeProfile',{body:apiValidation.createEmployeePayrollProfileSchema,status:201,validation:[['body','createEmployeePayrollProfileSchema']]}),
  route('GET','/employee-profiles',manager,'List employee payroll profiles','listEmployeeProfiles',{query:apiValidation.listEmployeeProfilesQuerySchema,validation:[['query','listEmployeeProfilesQuerySchema']]}),
  route('GET','/bank-details/lookup/by-account',manager,'Look up bank by account','lookupBankByAccount',{query:apiValidation.bankAccountLookupQuerySchema,validation:[['query','bankAccountLookupQuerySchema']]}),
  route('GET','/bank-details/lookup/by-ifsc/:ifscCode',manager,'Look up bank by IFSC','lookupBankByIfsc',{params:apiValidation.ifscLookupParamSchema,validation:[['params','ifscLookupParamSchema']]}),
  route('GET','/employee-profiles/:profileId',manager,'Get employee payroll profile','getEmployeeProfile',{params:apiValidation.profileIdParamSchema,validation:[['params','profileIdParamSchema']]}),
  route('PUT','/employee-profiles/:profileId',manager,'Update employee payroll profile','updateEmployeeProfile',{params:apiValidation.profileIdParamSchema,body:apiValidation.updateEmployeePayrollProfileSchema,validation:[['params','profileIdParamSchema'],['body','updateEmployeePayrollProfileSchema']]}),
  route('DELETE','/employee-profiles/:profileId',manager,'Delete employee payroll profile','deleteEmployeeProfile',{params:apiValidation.profileIdParamSchema,validation:[['params','profileIdParamSchema']]}),
  route('POST','/employee-profiles/:profileId/bank-details',manager,'Save employee bank details','upsertBankDetail',{params:apiValidation.profileIdParamSchema,body:apiValidation.upsertBankDetailSchema,status:201,validation:[['params','profileIdParamSchema'],['body','upsertBankDetailSchema']]}),
  route('POST','/employee-profiles/:profileId/statutory-details',manager,'Save employee statutory details','upsertStatutoryDetail',{params:apiValidation.profileIdParamSchema,body:apiValidation.upsertStatutoryDetailSchema,status:201,validation:[['params','profileIdParamSchema'],['body','upsertStatutoryDetailSchema']]}),
  route('POST','/employee-profiles/:profileId/salary-structures',manager,'Create employee salary structure','createSalaryStructure',{params:apiValidation.profileIdParamSchema,body:apiValidation.createSalaryStructureSchema,status:201,validation:[['params','profileIdParamSchema'],['body','createSalaryStructureSchema']]}),
  route('PUT','/salary-structures/:salaryStructureId',manager,'Update employee salary structure','updateSalaryStructure',{params:apiValidation.salaryStructureIdParamSchema,body:apiValidation.updateSalaryStructureSchema,validation:[['params','salaryStructureIdParamSchema'],['body','updateSalaryStructureSchema']]}),
  route('DELETE','/salary-structures/:salaryStructureId',manager,'Delete employee salary structure','deleteSalaryStructure',{params:apiValidation.salaryStructureIdParamSchema,validation:[['params','salaryStructureIdParamSchema']]}),
  route('POST','/runs', 'PAYROLL_RUN_CREATE','Create a payroll run','createRun',{body:apiValidation.createPayrollRunSchema,status:201,validation:[['body','createPayrollRunSchema']],idempotent:true}),
  route('GET','/runs',sharedRunPermissions,'List payroll runs','listRuns',{query:apiValidation.listPayrollRunsQuerySchema,validation:[['query','listPayrollRunsQuerySchema']]}),
  route('GET','/runs/:runId',sharedRunPermissions,'Get a payroll run','getRun',{params:apiValidation.runIdParamSchema,validation:[['params','runIdParamSchema']]}),
  route('POST','/runs/:runId/preview',sharedRunPermissions,'Preview a payroll run','previewRun',{params:apiValidation.runIdParamSchema,body:apiValidation.previewRunBodySchema,validation:[['params','runIdParamSchema'],['body','previewRunBodySchema']]}),
  route('GET','/runs/:runId/employee-breakdown',sharedRunPermissions,'Get payroll run employee breakdown','getRunEmployeeBreakdown',{params:apiValidation.runIdParamSchema,query:apiValidation.employeeBreakdownQuerySchema,validation:[['params','runIdParamSchema'],['query','employeeBreakdownQuerySchema']]}),
  route('POST','/attendance-snapshots/generate','PAYROLL_RUN_CREATE','Generate attendance snapshots','generateMonthlySnapshots',{body:attendanceValidation.generateSnapshotSchema,validation:[['body','generateSnapshotSchema']]}),
  route('GET','/attendance-snapshots',['PAYROLL_RUN_CREATE','PAYROLL_REPORT_VIEW'],'List attendance snapshots','listMonthlySnapshots',{query:attendanceValidation.listSnapshotsQuerySchema,validation:[['query','listSnapshotsQuerySchema']]}),
  route('POST','/runs/:runId/compute','PAYROLL_RUN_CREATE','Compute a payroll run','computeRun',{params:runValidation.computePayrollRunParamsSchema,body:runValidation.computePayrollRunBodySchema,validation:[['params','computePayrollRunParamsSchema'],['body','computePayrollRunBodySchema']],idempotent:true}),
  route('POST','/runs/:runId/recompute','PAYROLL_RUN_CREATE','Recompute a payroll run','recomputeRun',{params:apiValidation.runIdParamSchema,body:runValidation.computePayrollRunBodySchema,validation:[['params','runIdParamSchema'],['body','computePayrollRunBodySchema']],idempotent:true}),
  route('POST','/runs/:runId/submit',['PAYROLL_RUN_CREATE','PAYROLL_RUN_SUBMIT'],'Submit payroll run for approval','submitForApproval',{params:approvalValidation.runIdParamSchema,body:approvalValidation.submitForApprovalSchema,validation:[['params','runIdParamSchema'],['body','submitForApprovalSchema']],idempotent:true}),
  route('POST','/runs/:runId/approve','PAYROLL_RUN_APPROVE','Approve a payroll run','approveRun',{params:approvalValidation.runIdParamSchema,body:approvalValidation.approveRunSchema,validation:[['params','runIdParamSchema'],['body','approveRunSchema']],idempotent:true}),
  route('POST','/runs/:runId/reject','PAYROLL_RUN_APPROVE','Reject a payroll run','rejectRun',{params:approvalValidation.runIdParamSchema,body:approvalValidation.rejectRunSchema,validation:[['params','runIdParamSchema'],['body','rejectRunSchema']],idempotent:true}),
  route('POST','/runs/:runId/lock','PAYROLL_RUN_LOCK','Lock a payroll run','lockRun',{params:approvalValidation.runIdParamSchema,body:approvalValidation.lockRunSchema,validation:[['params','runIdParamSchema'],['body','lockRunSchema']],idempotent:true}),
  route('POST','/runs/:runId/reopen','PAYROLL_RUN_REOPEN','Reopen a payroll run','reopenRun',{params:approvalValidation.runIdParamSchema,body:approvalValidation.reopenRunSchema,validation:[['params','runIdParamSchema'],['body','reopenRunSchema']],idempotent:true}),
  route('GET','/runs/:runId/audit',['PAYROLL_REPORT_VIEW','PAYROLL_RUN_VIEW'],'List payroll run audit entries','listAuditEntries',{params:approvalValidation.runIdParamSchema,validation:[['params','runIdParamSchema']]}),
  route('GET','/runs/:runId/payslips/:employeeExternalId','PAYROLL_PAYSLIP_VIEW','Get an employee payslip for a run','getPayslipByRun',{params:payslipValidation.getRunPayslipParamsSchema,validation:[['params','getRunPayslipParamsSchema']]}),
  route('GET','/payslips/monthly','PAYROLL_PAYSLIP_VIEW','Get monthly employee payslip','getPayslipByMonth',{query:payslipValidation.getMonthlyPayslipQuerySchema,validation:[['query','getMonthlyPayslipQuerySchema']]}),
  route('GET','/payslips/my/monthly',selfPermissions,'Get my monthly payslip','getMyPayslipByMonth',{query:payslipValidation.getMyMonthlyPayslipQuerySchema,validation:[['query','getMyMonthlyPayslipQuerySchema']]}),
  route('GET','/payslips/my/months',selfPermissions,'List my payslip months','listMyPayslipMonths'),
  route('GET','/payslips/my/runs',selfPermissions,'List my payslip runs','listMyPayslipRuns'),
  route('GET','/payslips/my/runs/:runId',selfPermissions,'Get my payslip by run','getMyPayslipByRun',{params:payslipValidation.getMyRunPayslipParamsSchema,validation:[['params','getMyRunPayslipParamsSchema']]}),
  route('GET','/reports/payroll-register','PAYROLL_REPORT_VIEW','Get payroll register','payrollRegister',{query:reportsValidation.payrollRegisterQuerySchema,validation:[['query','payrollRegisterQuerySchema']]}),
  route('GET','/reports/bank-transfer-export','PAYROLL_REPORT_VIEW','Get bank transfer export','bankTransferExport',{query:reportsValidation.bankTransferQuerySchema,validation:[['query','bankTransferQuerySchema']]}),
  route('GET','/reports/deduction-summary','PAYROLL_REPORT_VIEW','Get deduction summary','deductionSummary',{query:reportsValidation.deductionSummaryQuerySchema,validation:[['query','deductionSummaryQuerySchema']]}),
  route('GET','/reports/employer-contribution-summary','PAYROLL_REPORT_VIEW','Get employer contribution summary','employerContributionSummary',{query:reportsValidation.employerContributionSummaryQuerySchema,validation:[['query','employerContributionSummaryQuerySchema']]}),
  route('GET','/reports/cost-center-totals','PAYROLL_REPORT_VIEW','Get cost center payroll totals','costCenterTotals',{query:reportsValidation.costCenterTotalsQuerySchema,validation:[['query','costCenterTotalsQuerySchema']]}),
  route('POST','/runs/:runId/validate','PAYROLL_RUN_CREATE','Validate a payroll run','validateRun',{params:validationValidation.validatePayrollRunParamsSchema,body:validationValidation.validatePayrollRunBodySchema,validation:[['params','validatePayrollRunParamsSchema'],['body','validatePayrollRunBodySchema']]}),
];

export const payrollRouteDefinitions = routes;
export const registerPayrollRoutes = async (app, { service, authenticate, authorize, idempotencyRequired = false }) => {
  if (!service) throw new TypeError('Payroll service is required.');
  for (const definition of routes) {
    const responses = { [definition.status]: response, 401: response, 403: response, 406: response, 500: response, 503: response };
    if (definition.idempotent) responses[409] = response;
    if (['computeRun','recomputeRun'].includes(definition.operation)) responses[202] = response;
    const schema = { tags: ['Payroll'], summary: definition.summary, security: [{ bearerAuth: [] }], response: responses };
    if (definition.params) schema.params = joiSchema(definition.params);
    if (definition.query) schema.querystring = joiSchema(definition.query);
    if (definition.body) schema.body = joiSchema(definition.body);
    if (definition.idempotent) {
      schema.headers = { type: 'object', properties: {
        'idempotency-key': { type: 'string', minLength: 8, maxLength: 120, pattern: '^[A-Za-z0-9:_-]+$', description: 'Request replay key; either this header or x-idempotency-key is required when PAYROLL_IDEMPOTENCY_REQUIRED is enabled.' },
        'x-idempotency-key': { type: 'string', minLength: 8, maxLength: 120, pattern: '^[A-Za-z0-9:_-]+$', description: 'Alternate request replay key header.' },
      }, additionalProperties: true };
    }
    app.route({
      method: definition.method,
      url: `/api/v2/payroll${definition.path}`,
      schema,
      validatorCompiler: () => data => ({ value: data }),
      preValidation: [authenticate, async (request, reply) => {
        const denied = await authorize(definition.permission, request);
        if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message));
      }, ...(definition.idempotent ? [async (request, reply) => {
        const raw = request.headers['idempotency-key'] || request.headers['x-idempotency-key'];
        const key = raw ? String(raw).trim() : '';
        if (!key) {
          if (idempotencyRequired) return reply.code(400).send(failure(400, 'Idempotency-Key header is required for this action'));
          return;
        }
        if (!/^[A-Za-z0-9:_-]{8,120}$/.test(key)) return reply.code(406).send(failure(406, 'Invalid Idempotency-Key format. Use 8-120 chars with letters, numbers, colon, underscore or hyphen.'));
        request.idempotencyKey = key;
      }] : []), ...(definition.query ? [async request => { request.payrollOriginalQuery = { ...request.query }; }] : []), ...definition.validation.map(([property, name]) => validate(findValidation(name), property))],
      handler: async (request, reply) => {
        if (typeof service[definition.operation] !== 'function') throw httpError(503, `Payroll operation ${definition.operation} is unavailable`);
        const data = definition.idempotent
          ? await service.executeAction({ operation: definition.operation, request })
          : await service[definition.operation](request);
        const status = ['computeRun','recomputeRun'].includes(definition.operation) && (request.body?.async === true || service.asyncComputeDefault === true) ? 202 : definition.status;
        const message = definition.operation === 'computeRun' && status === 202 ? 'Payroll run queued for async compute' : definition.operation === 'recomputeRun' && status === 202 ? 'Payroll run queued for async recompute' : payrollResponseMessages[definition.operation] || 'Success';
        return reply.code(status).send(success(data, message));
      },
    });
  }
};
const validationSets = [attendanceValidation, runValidation, validationValidation, apiValidation, approvalValidation, payslipValidation, reportsValidation];
const findValidation = name => {
  for (const set of validationSets) if (set[name]) return set[name];
  throw new Error(`Payroll validation schema ${name} was not found`);
};
