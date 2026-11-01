import Fastify from 'fastify';
import qs from 'qs';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { errorHandler } from './plugins/errors.js';
import { createAuthenticationHook } from './plugins/authentication.js';
import { createRateLimiter } from './plugins/rate-limit.js';
import { registerAuthRoutes } from './modules/auth/auth.routes.js';
import { registerDepartmentRoutes } from './modules/departments/department.routes.js';
import { registerPermissionRoutes } from './modules/permissions/permission.routes.js';
import { registerRoleRoutes } from './modules/roles/role.routes.js';
import { registerDesignationRoutes } from './modules/designations/designation.routes.js';
import { registerLeaveTypeRoutes } from './modules/leave-types/leave-type.routes.js';
import { registerHolidayRoutes } from './modules/holidays/holiday.routes.js';
import { registerWeekOffRoutes } from './modules/week-offs/week-off.routes.js';
import { registerShiftRoutes } from './modules/shifts/shift.routes.js';
import { registerApprovalFlowRoutes } from './modules/approval-flows/approval-flow.routes.js';
import { registerLeaveBalanceRoutes } from './modules/leave-balances/leave-balance.routes.js';
import { registerOrgSettingsRoutes } from './modules/org-settings/org-settings.routes.js';
import { registerOrganizationDocumentRoutes } from './modules/organization-documents/organization-document.routes.js';
import { registerNotificationRoutes } from './modules/notifications/notification.routes.js';
import { registerProjectRoutes } from './modules/projects/project.routes.js';
import { registerMonitorUpdateRoutes } from './modules/monitor-updates/monitor-update.routes.js';
import { registerEmployeeRoutes } from './modules/employees/employee.routes.js';
import { registerExpenseRoutes } from './modules/expenses/expense.routes.js';
import { registerHiringRoutes } from './modules/hiring/hiring.routes.js';
import { registerOrganizationRoutes } from './modules/organizations/organization.routes.js';
import { registerUserAdministrationRoutes } from './modules/user-administration/user-administration.routes.js';
import { registerAgentRoutes } from './modules/agents/agent.routes.js';
import { registerLeaveRoutes } from './modules/leaves/leave.routes.js';
import { registerActivityRoutes } from './modules/activity/activity.routes.js';
import { registerDashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { registerTimesheetRoutes } from './modules/timesheets/timesheet.routes.js';
import { registerPayrollRoutes } from './modules/payroll/payroll.routes.js';
export const buildApp = async ({ config, authService, authenticate, authorize, departmentService, roleService, designationService, leaveTypeService, leaveService, activityService, holidayService, weekOffService, shiftService, approvalFlowService, leaveBalanceService, orgSettingsService, organizationDocumentService, notificationService, projectService, monitorUpdateService, employeeService, expenseService, hiringService, organizationService, userAdministrationService, agentService, dashboardService, timesheetService, payrollService, isReady, payrollIdempotencyRequired = false, logger = true }) => {
  const app = Fastify({ bodyLimit: 25 * 1024 * 1024, trustProxy: config.trustProxy,
    logger: logger === false ? false : { level: 'info', redact: ['req.headers.authorization','req.headers.cookie','res.headers.authorization'], serializers: { req: req => ({ method: req.method, url: req.url?.split('?')[0], id: req.id }), res: res => ({ statusCode: res.statusCode }) } },
    routerOptions: { ignoreTrailingSlash: true },
  });
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) => {
    if (!body.trim()) return done(null, {});
    if (!/^[\s]*[\[{]/.test(body)) {
      const error = Object.assign(new Error('Invalid JSON request body'), { statusCode: 400, code: 'V2_INVALID_JSON_BODY', publicMessage: 'Invalid JSON request body' });
      return done(error);
    }
    try { return done(null, JSON.parse(body)); }
    catch (cause) {
      // Syntax errors that quote raw body fragments can echo secrets; use the stable
      // position-only V1 parse message when available, and redact source excerpts.
      const message = /Unexpected token [^,]+, \"/.test(cause.message) ? 'Invalid JSON request body' : cause.message;
      const error = Object.assign(new SyntaxError(message), { statusCode: 400, code: 'V2_INVALID_JSON_BODY', publicMessage: message });
      return done(error);
    }
  });
  app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_request, body, done) => {
    if (body.split('&').length > 1000) return done(Object.assign(new Error('too many parameters'), { statusCode: 413, publicMessage: 'too many parameters' }));
    try { done(null, qs.parse(body, { depth: 32, strictDepth: true, parameterLimit: 1000, allowPrototypes: true })); }
    catch { done(Object.assign(new Error('The input exceeded the depth'), { statusCode: 400, publicMessage: 'The input exceeded the depth' })); }
  });
  app.decorate('applicationRoutes', []);
  app.decorateRequest('user', null);
  app.addHook('onRoute', route => {
    if (route.url === '/' || route.url.startsWith('/api/v2/')) for (const method of [route.method].flat()) if (method !== 'HEAD') app.applicationRoutes.push({ method, url: route.url, schema: route.schema });
  });
  // JSON.stringify retains legacy ObjectId/date serialization and nullable/optional data.
  app.setSerializerCompiler(() => data => JSON.stringify(data));
  app.setErrorHandler(errorHandler);
  await app.register(cors, { origin: (origin, callback) => callback(null, !origin || config.corsOrigins.includes(origin)), credentials: true, exposedHeaders: ['Content-Type','Authorization','Access-Control-Allow-Credentials'], optionsSuccessStatus: 200 });
  await app.register(swagger, { openapi: { info: { title: 'Rigweda HRMS API V2', version: '2.0.0' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } } } });
  await app.register(swaggerUi, { routePrefix: '/docs' });
  const status = value => ({ type: 'object', properties: { status: { type: 'string', const: value } }, required: ['status'] });
  app.get('/', { schema: { tags: ['Operations'], summary: 'Get service information', response: { 200: { type: 'object', properties: { message: { type: 'string' }, docs: { type: 'string' } } } } } }, async () => ({ message: 'Rigweda HRMS API V2', docs: '/docs' }));
  app.get('/api/v2/health', { schema: { tags: ['Operations'], summary: 'Check process liveness', response: { 200: status('healthy') } } }, async () => ({ status: 'healthy' }));
  app.get('/api/v2/ready', { schema: { tags: ['Operations'], summary: 'Check MongoDB readiness', response: { 200: status('ready'), 503: status('not_ready') } } }, async (_request, reply) => {
    try { await isReady(); return { status: 'ready' }; } catch { return reply.code(503).send({ status: 'not_ready' }); }
  });
  const limiter = createRateLimiter({ max: config.authLimit, windowMs: config.rateWindowMs, auth: true });
  app.addHook('onRequest', async (request, reply) => { if (request.url.startsWith('/api/v2/users/')) return limiter(request, reply); });
  await registerAuthRoutes(app, { service: authService, authenticate: createAuthenticationHook(authenticate), publicLimiter: createRateLimiter({ max: config.publicLimit, windowMs: config.rateWindowMs }) });
  if (departmentService) await registerDepartmentRoutes(app, { service: departmentService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (authService.listPermissions) await registerPermissionRoutes(app, { service: authService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (roleService) await registerRoleRoutes(app, { service: roleService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (designationService) await registerDesignationRoutes(app, { service: designationService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (leaveTypeService) await registerLeaveTypeRoutes(app, { service: leaveTypeService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (holidayService) await registerHolidayRoutes(app, { service: holidayService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (weekOffService) await registerWeekOffRoutes(app, { service: weekOffService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (shiftService) await registerShiftRoutes(app, { service: shiftService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (approvalFlowService) await registerApprovalFlowRoutes(app, { service: approvalFlowService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (leaveBalanceService) await registerLeaveBalanceRoutes(app, { service: leaveBalanceService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (orgSettingsService) await registerOrgSettingsRoutes(app, { service: orgSettingsService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (organizationDocumentService) registerOrganizationDocumentRoutes(app, { service: organizationDocumentService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (notificationService) await registerNotificationRoutes(app, { service: notificationService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (projectService) await registerProjectRoutes(app, { service: projectService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (monitorUpdateService) await registerMonitorUpdateRoutes(app, { service: monitorUpdateService, authenticate: createAuthenticationHook(authenticate) });
  if (employeeService) registerEmployeeRoutes(app, { service: employeeService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (expenseService) await registerExpenseRoutes(app, { service: expenseService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (hiringService) await registerHiringRoutes(app, { service: hiringService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (organizationService) await registerOrganizationRoutes(app, { service: organizationService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (userAdministrationService) await registerUserAdministrationRoutes(app, { service: userAdministrationService, authenticate: createAuthenticationHook(authenticate), authorize });
  if (agentService) await registerAgentRoutes(app, { service:agentService, authenticate:createAuthenticationHook(authenticate), authorize });
  if (leaveService) await registerLeaveRoutes(app, { service:leaveService, authenticate:createAuthenticationHook(authenticate), authorize });
  if (activityService) await registerActivityRoutes(app, { service:activityService, authenticate:createAuthenticationHook(authenticate), authorize });
  if (dashboardService) await registerDashboardRoutes(app, { service:dashboardService, authenticate:createAuthenticationHook(authenticate), authorize });
  if (timesheetService) await registerTimesheetRoutes(app, { service:timesheetService, authenticate:createAuthenticationHook(authenticate), authorize });
  if (payrollService) await registerPayrollRoutes(app, { service:payrollService, authenticate:createAuthenticationHook(authenticate), authorize, idempotencyRequired:payrollIdempotencyRequired });
  return app;
};
