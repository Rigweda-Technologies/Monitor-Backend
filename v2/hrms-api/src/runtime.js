import { loadConfig } from './config/env.js';
import { connectDatabase } from './database/mongoose.js';
import { createAuthRepository } from './modules/auth/auth.repository.js';
import { createSessionService } from './modules/auth/session.service.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createTokens } from './integrations/tokens.js';
import { createPasswords } from './integrations/passwords.js';
import { createOtpMailer } from './integrations/otp-mailer.js';
import { createFaceVerifier } from './integrations/face-verifier.js';
import { createDepartmentModels } from './modules/departments/department.models.js';
import { createDepartmentService } from './modules/departments/department.service.js';
import { createRoleService } from './modules/roles/role.service.js';
import { createDesignationModels } from './modules/designations/designation.models.js';
import { createDesignationService } from './modules/designations/designation.service.js';
import { createLeaveTypeModels } from './modules/leave-types/leave-type.models.js';
import { createLeaveTypeService } from './modules/leave-types/leave-type.service.js';
import { createHolidayModels } from './modules/holidays/holiday.models.js';
import { createHolidayService } from './modules/holidays/holiday.service.js';
import { createWeekOffModels } from './modules/week-offs/week-off.models.js';
import { createWeekOffService } from './modules/week-offs/week-off.service.js';
import { createShiftModels } from './modules/shifts/shift.models.js';
import { createShiftService } from './modules/shifts/shift.service.js';
import { createApprovalFlowModels } from './modules/approval-flows/approval-flow.models.js';
import { createApprovalFlowService } from './modules/approval-flows/approval-flow.service.js';
import { createLeaveBalanceModels } from './modules/leave-balances/leave-balance.models.js';
import { createLeaveBalanceService } from './modules/leave-balances/leave-balance.service.js';
import { createOrgSettingsModels } from './modules/org-settings/org-settings.models.js';
import { createOrgSettingsService } from './modules/org-settings/org-settings.service.js';
import { createOrganizationDocumentModels } from './modules/organization-documents/organization-document.models.js';
import { createOrganizationDocumentService } from './modules/organization-documents/organization-document.service.js';
import { createNotificationModels } from './modules/notifications/notification.models.js';
import { createNotificationService } from './modules/notifications/notification.service.js';
import { createProjectModels } from './modules/projects/project.models.js';
import { createProjectService } from './modules/projects/project.service.js';
import { createCloudinaryAdapter } from './integrations/cloudinary.js';
import { createFirebasePushSender } from './integrations/firebase-push.js';
import { createR2ReleaseStorage } from './integrations/r2-release-storage.js';
import { createEmployeeModels } from './modules/employees/employee.models.js';
import { createEmployeeService } from './modules/employees/employee.service.js';
import { createExpenseModels } from './modules/expenses/expense.models.js';
import { createExpenseService } from './modules/expenses/expense.service.js';
import { createHiringModels } from './modules/hiring/hiring.models.js';
import { createHiringService } from './modules/hiring/hiring.service.js';
import { createModels } from './modules/auth/auth.models.js';
import { createMonitorUpdateModels } from './modules/monitor-updates/monitor-update.models.js';
import { createMonitorUpdateService } from './modules/monitor-updates/monitor-update.service.js';
import { createOrganizationService } from './modules/organizations/organization.service.js';
import { createOrganizationPayrollRepository } from './modules/organizations/organization-payroll.repository.js';
import { createUserAdministrationService } from './modules/user-administration/user-administration.service.js';
import { createOrganizationSeeder } from './modules/roles/organization-seeder.js';
import { createAgentService } from './modules/agents/agent.service.js';
import { createAgentCloudinaryAdapter } from './modules/agents/agent.cloudinary.js';
import { createAgentMonitorRepository } from './modules/agents/agent-monitor.repository.js';
import { httpError } from './plugins/errors.js';
import { createLeaveModels } from './modules/leaves/leave.models.js';
import { createLeaveService } from './modules/leaves/leave.service.js';
import { createLeavePolicy } from './modules/leaves/leave.policy.js';
import { createLeaveApproval } from './modules/leaves/leave.approval.js';
import { createLeaveEffects } from './modules/leaves/leave.effects.js';
import { createActivityService } from './modules/activity/activity.service.js';
import { createMonitorActivityRepository } from './modules/activity/activity.repository.js';
import { buildApp } from './app.js';
import { connectPrismaClients } from './database/prisma.js';
import { createTimesheetModels } from './modules/timesheets/timesheet.models.js';
import { createTimesheetService } from './modules/timesheets/timesheet.service.js';
import { createTimesheetPolicies } from './modules/timesheets/timesheet.policies.js';
import { createTimesheetMonitorRepository } from './modules/timesheets/timesheet-monitor.repository.js';
import { createAttendanceFaceVerifier } from './modules/timesheets/timesheet-face-verifier.js';
import { createDashboardService } from './modules/dashboard/dashboard.service.js';
import { createPayrollModels } from './modules/payroll/payroll.models.js';
import { createPayrollService } from './modules/payroll/payroll.service.js';
import { createPayrollRepository } from './modules/payroll/payroll.repository.js';
import { createRealtimeAdapter } from './integrations/realtime.js';
import { JOBS, createJobProcessor, createJobScheduler, createJobWorker, getJobQueueName } from './jobs/runtime.js';
import { createHrmsJobHandlers } from './jobs/business-handlers.js';
export const createRuntime = async ({ config = loadConfig(), connection: suppliedConnection, logger = true, sendOtp, verifySelfie, socketServer, realtimeEnabled = false, jobQueue = null, jobWorkerFactory = null, jobConnection = null, connect = connectDatabase } = {}) => {
  const connection = suppliedConnection || await connect(config);
  let postgres;
  let mailer;
  try {
    postgres = await connectPrismaClients(config.postgres || {});
    const employeeModels = createEmployeeModels(connection);
    const sharedModels = createModels(connection);
    const repository = createAuthRepository({ connection });
    const departmentModels = createDepartmentModels(connection);
    const designationModels = createDesignationModels(connection);
    const leaveTypeModels = createLeaveTypeModels(connection);
    const holidayModels = createHolidayModels(connection);
    const weekOffModels = createWeekOffModels(connection);
    const shiftModels = createShiftModels(connection);
    const approvalFlowModels = createApprovalFlowModels(connection);
    const leaveModels = createLeaveModels(connection);
    const leaveBalanceModels = createLeaveBalanceModels(connection);
    const orgSettingsModels = createOrgSettingsModels(connection);
    const notificationModels = createNotificationModels(connection);
    const organizationDocumentModels = createOrganizationDocumentModels(connection);
    const projectModels = createProjectModels(connection);
    const expenseModels = createExpenseModels(connection);
    const hiringModels = createHiringModels(connection);
    const monitorUpdateModels = createMonitorUpdateModels(connection);
    const timesheetModels = createTimesheetModels(connection);
    const tokens = createTokens(config);
    mailer = createOtpMailer({ config: config.smtp, timeoutMs: config.timeoutMs });
    const session = createSessionService({ repository, verifyToken: tokens.verifyToken });
    const realtime = createRealtimeAdapter({ io:socketServer, enabled:realtimeEnabled, authenticate:session.authenticate, verifyToken:tokens.verifyToken });
    const authService = createAuthService({ repository, config, ...tokens, ...createPasswords(config.bcryptRounds), sendOtp: sendOtp || mailer.sendOtp, verifySelfie: verifySelfie || createFaceVerifier({ config: config.face, timeoutMs: config.timeoutMs }) });
    const departmentService = createDepartmentService({ models: departmentModels, isSuperAdmin: async userId => {
      const user = await repository.userById(userId);
      if (user?.roleKey === 'superadmin') return true;
      const role = user?.lastActiveRoleId ? await repository.role(user.lastActiveRoleId, user.activeOrganizationId) : null;
      return role?.slug === 'superadmin';
    } });
    const roleService = createRoleService({ repository, signToken: tokens.signToken, config });
    const organizationSeeder = createOrganizationSeeder({ Role:sharedModels.Role, Permission:sharedModels.Permission });
    const designationService = createDesignationService(designationModels);
    const leaveTypeService = createLeaveTypeService(leaveTypeModels);
    const holidayService = createHolidayService(holidayModels);
    const weekOffService = createWeekOffService(weekOffModels);
    const shiftService = createShiftService(shiftModels);
    const approvalFlowService = createApprovalFlowService(approvalFlowModels);
    const leaveBalanceService = createLeaveBalanceService(leaveBalanceModels);
    const cloudinary = createCloudinaryAdapter({ credentials: config.cloudinary, timeoutMs: config.timeoutMs });
    let orgSettingsService;
    const notificationService = createNotificationService(notificationModels, { sendPushNotification: createFirebasePushSender({ config: config.firebase, timeoutMs: config.timeoutMs }), emitNotification:realtime.emitNotification });
    const organizationDocumentService = createOrganizationDocumentService({ models: { ...organizationDocumentModels, ...notificationModels }, cloudinary, notify:notificationService.createNotificationSafe });
    const projectService = createProjectService(projectModels, { uploadDataUri: cloudinary.uploadDataUri });
    const monitorUpdateService = createMonitorUpdateService(monitorUpdateModels, { releaseStorage: createR2ReleaseStorage({ config: config.r2, timeoutMs: config.timeoutMs }), defaultDownloadUrl: config.r2.defaultDownloadUrl });
    const employeeService = createEmployeeService({ models: { ...sharedModels, ...employeeModels, OrgUser: sharedModels.Membership, ApprovalFlow: approvalFlowModels.ApprovalFlow, OrgSettings: orgSettingsModels.OrgSettings, AuditLog: departmentModels.AuditLog }, integrations: {
      hashPassword: createPasswords(config.bcryptRounds).hashPassword,
      uploadDataUri: cloudinary.uploadDataUri,
      initializeLeaveBalance: leaveTypeService.initializeForEmployee,
      getOrganizationById: organizationId => sharedModels.Organization.findById(organizationId),
      sendOnboardingEmail: ({ employeeName, email, password, organizationName }) => mailer.sendMail('employeeOnboarding', employeeName, `Welcome to ${organizationName || 'HRMS'}`, { employeeName, email, password, orgName: organizationName || 'HRMS', loginUrl: config.frontendLoginUrl || '' }, email),
      createNotificationSafe: notificationService.createNotificationSafe,
      getEmployeeLeaves: request => leaveTypeService.getEmployeeLeaves(request),
      audit: async ({ action, actorUserId, organizationId, employeeId, ...details }) => departmentModels.AuditLog.create({ organizationId, userId: actorUserId, module: 'employees', action, entityId: employeeId, after: details, ipAddress: details.ipAddress, userAgent: details.userAgent }),
      withMongoTransaction: async callback => {
        const session = await connection.startSession();
        try {
          session.startTransaction();
          const result = await callback(session);
          await session.commitTransaction();
          return result;
        } catch (error) {
          const transactionErrors = [error, error?.errorResponse?.originalError, error?.cause];
          const unsupported = transactionErrors.some(cause => cause?.codeName === 'IllegalOperation' || String(cause?.message || '').includes('Transaction numbers are only allowed'));
          if (session.inTransaction()) await session.abortTransaction();
          if (unsupported) return callback(undefined);
          throw error;
        } finally { await session.endSession(); }
      },
    }, env: process.env });
    const expenseService = createExpenseService(expenseModels, { uploadDataUri: cloudinary.uploadDataUri });
    const hiringService = createHiringService(hiringModels, { sendMail: mailer.sendMail, createOrgUser: employeeService.createOrgUser, config: { smtpUser: config.smtp.user, frontendLoginUrl: config.frontendLoginUrl } });
    const leaveDomainModels={...leaveModels,...sharedModels,...employeeModels,...leaveTypeModels,...leaveBalanceModels,...holidayModels,...weekOffModels,...shiftModels,...approvalFlowModels,OrgUser:sharedModels.Membership,Settings:orgSettingsModels.OrgSettings,OrgSettings:orgSettingsModels.OrgSettings,AuditLog:departmentModels.AuditLog};
    const leaveApproval=createLeaveApproval(leaveDomainModels);
    const leavePolicy=createLeavePolicy(leaveDomainModels,{weekOffService});
    const leaveEffects=createLeaveEffects({...leaveDomainModels,...notificationModels},{notificationService,sendMail:mailer.sendMail});
    const leaveService=createLeaveService(leaveDomainModels,{resolvePolicy:leavePolicy.resolvePolicy,resolveApproval:leaveApproval.resolveFlow,authorizeAction:leaveApproval.authorizeAction,progressApproval:leaveApproval.progress,repairApproval:leaveApproval.repair,listPendingApprovals:leaveApproval.listPending,scopeList:leaveApproval.scopeList,enrichLeaves:leavePolicy.enrichLeaves,audit:leaveEffects.audit,notify:leaveEffects.notify});
    const payrollModels = createPayrollModels(connection, {
      Employee:employeeModels.Employee, OrgSettings:orgSettingsModels.OrgSettings, Organization:sharedModels.Organization,
      Role:sharedModels.Role, Leave:leaveModels.Leave, LeaveType:leaveTypeModels.LeaveType,
      WeekOff:weekOffModels.WeekOff, Holiday:holidayModels.Holiday, Attendance:timesheetModels.Attendance,
    });
    const payrollPrismaRepository = postgres.payroll ? createPayrollRepository({ prisma:postgres.payroll }) : null;
    const payrollService = payrollPrismaRepository
      ? createPayrollService({ repository:payrollPrismaRepository, monitorRepository:postgres.monitor ? createPayrollRepository({ prisma:postgres.monitor }) : null, models:payrollModels, queue:jobQueue, config })
      : new Proxy({ executeAction:async()=>{ throw httpError(503,'Payroll database is not configured.'); } }, { get:(target,key)=>key in target ? target[key] : typeof key === 'string' ? async()=>{ throw httpError(503,'Payroll database is not configured.'); } : undefined });
    const unavailableMonitorRepository = new Proxy({}, { get:(_target,method)=>async()=>{ throw httpError(503,'Monitor database is not configured. Set MONITOR_DATABASE_URL.'); } });
    orgSettingsService = createOrgSettingsService(orgSettingsModels, {
      uploadDataUri:cloudinary.uploadDataUri,
      ensurePayrollTenantAndDefaults:payload => payrollService.ensurePayrollTenantAndDefaults(payload),
    });
    const timesheetPolicies = createTimesheetPolicies({
      models:{ ApprovalFlow:approvalFlowModels.ApprovalFlow, Employee:employeeModels.Employee, Role:sharedModels.Role, OrgUser:sharedModels.Membership },
      weekOffService,
    });
    const timesheetService = createTimesheetService({
      models:{ ...timesheetModels, Employee:employeeModels.Employee, Leave:leaveModels.Leave, Role:sharedModels.Role,
        OrgSettings:orgSettingsModels.OrgSettings, Organization:sharedModels.Organization, Holiday:holidayModels.Holiday,
        AuditLog:departmentModels.AuditLog, Shift:shiftModels.Shift, ApprovalFlow:approvalFlowModels.ApprovalFlow, User:sharedModels.User },
      monitorRepository:postgres.monitor ? createTimesheetMonitorRepository({ prisma:postgres.monitor }) : unavailableMonitorRepository,
      integrations:{
        audit:({req,module,action,entityId,before,after})=>departmentModels.AuditLog.create({ organizationId:req.user.organizationId, userId:req.user?._id||req.user?.userId, module, action, entityId, before, after, ipAddress:req.ip, userAgent:req.headers?.['user-agent']||'' }),
        sendMail:mailer.sendMail, createNotificationSafe:notificationService.createNotificationSafe,
        emitAttendanceUpdate:realtime.emitAttendanceUpdate,
        compareAttendanceFaces:createAttendanceFaceVerifier({config:config.face,timeoutMs:config.timeoutMs}),
        payrollAttendanceService:{
          listMonthlyAttendanceSnapshots:request=>payrollService.listMonthlySnapshots(request),
          generateMonthlyAttendanceSnapshots:request=>payrollService.generateMonthlySnapshots(request),
        },
      },
      policies:timesheetPolicies,
    });
    const dashboardService = createDashboardService({ models:{OrgSettings:orgSettingsModels.OrgSettings,Organization:sharedModels.Organization}, dependencies:{
      getPermissionCodes:request=>authService.permissions(request.user),
      listEmployees:request=>employeeService.listByOrganization(request),
      listHolidays:async({organizationId,year})=>{const start=new Date(Date.UTC(Number(year),0,1));const end=new Date(Date.UTC(Number(year)+1,0,1));return holidayModels.Holiday.find({organizationId,status:'active',date:{$gte:start,$lt:end}}).sort({date:1}).lean();},
      getOrgSettings:request=>orgSettingsModels.OrgSettings.findOne({organizationId:request.user.organizationId}).lean(),
      listNotifications:request=>notificationService.getMyNotifications(request),
      resolveWeekOffMap:params=>weekOffService.resolveWeekOffMapForEmployees(params),
      getAttendanceSettings:organizationId=>orgSettingsModels.OrgSettings.findOne({organizationId}).select('attendanceHoursSource minWorkHoursPerDay').lean(),
      listAttendance:({organizationId,employeeIds,startKey,endKey})=>timesheetModels.Attendance.find({organizationId,employeeId:{$in:employeeIds},dateKey:{$gte:startKey,$lte:endKey}}).lean(),
      listLeaves:({organizationId,employeeIds,status,fromDate,toDate})=>leaveModels.Leave.find({organizationId,employeeId:{$in:employeeIds},status,fromDate:{$lte:toDate},toDate:{$gte:fromDate}}).populate('leaveTypeId','name').lean(),
      listTimesheets:({organizationId,employeeIds,fromDate,toDate})=>timesheetModels.Timesheet.find({organizationId,employeeId:{$in:employeeIds},weekStart:{$lte:toDate},weekEnd:{$gte:fromDate}}).sort({weekStart:-1}).limit(50).lean(),
      materializeMonitorAttendance:params=>timesheetService.__private__.materializeMonitorAttendance(params),
    }});
    const jobHandlers = createHrmsJobHandlers({
      models:{Organization:sharedModels.Organization,OrgSettings:orgSettingsModels.OrgSettings,LeaveType:leaveTypeModels.LeaveType,LeaveBalance:leaveBalanceModels.LeaveBalance,Employee:employeeModels.Employee,Role:sharedModels.Role,OrgUser:sharedModels.Membership,Attendance:timesheetModels.Attendance},
      notificationService, organizationDocumentService, timesheetService,
    });
    const processJob = createJobProcessor({
      ...jobHandlers,
      [JOBS.PAYROLL_RUN_COMPUTE]:job=>{
        if(typeof payrollService.processPayrollRunComputeJob!=='function')throw httpError(503,'Payroll compute worker is unavailable.');
        return payrollService.processPayrollRunComputeJob(job);
      },
    });
    const jobScheduler = createJobScheduler({queue:jobQueue,config:config.jobs||{},enabled:Boolean(jobQueue&&config.jobs?.schedulerEnabled),ownsQueue:false});
    const jobWorker = createJobWorker({queueName:getJobQueueName(config.jobs||{}),connection:jobConnection,concurrency:config.jobs?.workerConcurrency||1,processJob,createWorker:jobWorkerFactory,enabled:Boolean(jobWorkerFactory&&config.jobs?.workerEnabled)});
    const payrollRepository = createOrganizationPayrollRepository({ prisma:postgres.payroll, enabled:Boolean(config.postgres?.payroll?.enabled) });
    const organizationModels = { ...sharedModels, ...employeeModels, OrgUser:sharedModels.Membership, OrgSettings:orgSettingsModels.OrgSettings, scopedModels:Object.fromEntries(Object.values(connection.models).map(model=>[model.modelName,model])) };
    const organizationService = createOrganizationService({ models:organizationModels, seedOrganizationRoles:organizationSeeder, initializeLeaveBalance:leaveTypeService.initializeForEmployee, isSuperAdmin:async userId=>{
      const memberships=await sharedModels.Membership.find({userId}).populate('roleIds');
      return memberships.some(membership=>(membership.roleIds||[]).some(role=>['superadmin','super_admin'].includes(String(role?.slug||'').toLowerCase())));
    }, payrollRepository });
    const userAdministrationService = createUserAdministrationService({ models:{...organizationModels}, hashPassword:createPasswords(config.bcryptRounds).hashPassword, initializeLeaveBalance:leaveTypeService.initializeForEmployee, sendOnboardingEmail:({email,password,employeeName,organizationName})=>mailer.sendMail('employeeOnboarding',employeeName,`Welcome to ${organizationName||'HRMS'}`,{employeeName,email,password,orgName:organizationName||'HRMS',loginUrl:config.frontendLoginUrl||''},email), env:process.env });
    const agentService = createAgentService({ models:{...sharedModels,...employeeModels,OrgSettings:orgSettingsModels.OrgSettings}, monitorRepository:postgres.monitor ? createAgentMonitorRepository({prisma:postgres.monitor}) : unavailableMonitorRepository, cloudinary:createAgentCloudinaryAdapter({timeoutMs:config.timeoutMs}), emitMonitorSettingsUpdate:realtime.emitMonitorSettingsUpdate });
    const monitorActivityRepository=postgres.monitor?createMonitorActivityRepository({prisma:postgres.monitor}):unavailableMonitorRepository;
    const activityService=createActivityService({models:{...employeeModels,OrgSettings:orgSettingsModels.OrgSettings,Organization:sharedModels.Organization},repository:monitorActivityRepository});
    const authorize = async (permission, request) => {
      if (request.user?.roleKey === 'superadmin' || request.user?.activeRoleId === 'superadmin' || request.user?.bypassMonitorDb) return null;
      if (!request.user?.activeRoleId) return { code: 403, message: 'Access denied: active role not set' };
      const role = await repository.role(request.user.activeRoleId, request.user.organizationId);
      if (!role) return { code: 403, message: 'Role not found' };
      if (role.isSystemRole) return null;
      const permissions = await authService.permissions(request.user);
      const required = Array.isArray(permission) ? permission : [permission];
      if (permissions.includes('*') || required.some(code => permissions.includes(code))) return null;
      return { code: 403, message: `Permission denied: ${required.join(' | ')}` };
    };
    const app = await buildApp({ config, authService, authenticate: session.authenticate, authorize, departmentService, roleService, designationService, leaveTypeService, leaveService, activityService, holidayService, weekOffService, shiftService, approvalFlowService, leaveBalanceService, orgSettingsService, organizationDocumentService, notificationService, projectService, monitorUpdateService, employeeService, expenseService, hiringService, organizationService, userAdministrationService, agentService, dashboardService, timesheetService, payrollService, payrollIdempotencyRequired:Boolean(config.payroll?.idempotencyRequired), logger, isReady: async () => {
      await connection.db.command({ ping: 1 }, { maxTimeMS: config.timeoutMs });
      // V1 readiness does not depend on the optional shared monitor reader; keep
      // that boundary during coexistence. Payroll remains a required dependency
      // only when its existing opt-in flag is enabled.
      if (postgres.payroll) await postgres.payroll.$queryRaw`SELECT 1`;
    } });
    app.addHook('onClose', async () => { try { await jobWorker.close(); await jobScheduler.close(); mailer.close(); } finally { try { await postgres.close(); } finally { if (!suppliedConnection) await connection.close(); } } });
    return { app, connection, postgres, repository, departmentModels, departmentService, roleService, organizationService, userAdministrationService, organizationModels, organizationSeeder, payrollRepository, payrollModels, payrollService, agentService, activityService, monitorActivityRepository, leaveModels, leaveService, leavePolicy, leaveApproval, leaveEffects, designationModels, designationService, leaveTypeModels, leaveTypeService, holidayModels, holidayService, weekOffModels, weekOffService, shiftModels, shiftService, approvalFlowModels, approvalFlowService, leaveBalanceModels, leaveBalanceService, orgSettingsModels, orgSettingsService, organizationDocumentModels, organizationDocumentService, notificationModels, notificationService, projectModels, projectService, monitorUpdateModels, monitorUpdateService, employeeModels, employeeService, timesheetModels, timesheetService, timesheetPolicies, dashboardService, realtime, jobHandlers, processJob, jobScheduler, jobWorker, expenseModels, expenseService, hiringModels, hiringService, config, close: () => app.close() };
  } catch (error) { mailer?.close(); try { await postgres?.close(); } finally { if (!suppliedConnection) await connection.close(); } throw error; }
};
