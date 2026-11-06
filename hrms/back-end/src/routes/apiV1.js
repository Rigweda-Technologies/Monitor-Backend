const { API_V1_PREFIX } = require("../config/api");

const API_V1_ROUTES = [
  ["/users", "../modules/users/user.routes"],
  ["/organizations", "../modules/organizations/organization.routes"],
  ["/roles", "../modules/roles/role.routes"],
  ["/permissions", "../modules/permissions/permission.routes"],
  ["/employees", "../modules/employees/employee.routes"],
  ["/agents", "../modules/agent/agent.routes"],
  ["/monitor", "../modules/monitorUpdates/monitorUpdates.routes"],
  ["/departments", "../modules/departments/department.routes"],
  ["/designations", "../modules/designations/designation.routes"],
  ["/leave-types", "../modules/leaveTypes/leaveType.routes"],
  ["/leaves", "../modules/leaves/leave.routes"],
  ["/holidays", "../modules/holidays/holiday.routes"],
  ["/week-offs", "../modules/weekOffs/weekOff.routes"],
  ["/shifts", "../modules/shifts/shift.routes"],
  ["/approval-flows", "../modules/approvalFlows/approvalFlow.routes"],
  ["/leave-balances", "../modules/leaveBalances/leaveBalance.routes"],
  ["/timesheets", "../modules/timesheets/timesheet.routes"],
  ["/org-settings", "../modules/orgSettings/orgSettings.routes"],
  ["/organization-documents", "../modules/organizationDocuments/organizationDocuments.routes"],
  ["/notifications", "../modules/notifications/notification.routes"],
  ["/expenses", "../modules/expenses/expense.routes"],
  ["/projects", "../modules/projects/project.routes"],
  ["/hiring", "../modules/hiring/hiring.routes"],
  ["/dashboard", "../modules/dashboard/dashboard.routes"],
  ["/payroll", "../modules/payroll/payrollAttendance.routes"],
  ["/activity", "../modules/activity/activity.routes"]
];

const mountApiV1Routes = (app, {
  loadRouter = require,
  mountFcm = require("../integrations/fcm").mount
} = {}) => {
  mountFcm(app, API_V1_PREFIX);

  for (const [path, modulePath] of API_V1_ROUTES) {
    app.use(`${API_V1_PREFIX}${path}`, loadRouter(modulePath));
  }
};

module.exports = {
  API_V1_PREFIX,
  API_V1_ROUTES,
  mountApiV1Routes
};
