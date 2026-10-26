# HRMS API mount inventory

Source: `hrms/back-end/app.js`, inspected 26 October 2026. This is a mount-level inventory, not a complete endpoint or field-level contract inventory. Every row is **inventoried only**; v2 is not implemented.

Preserve current routes and callers. Proposed v2 routes use `/api/v2` in the independent HRMS service. Expand each router into its HTTP methods, nested paths, middleware, permissions, request/response fields, statuses, data dependencies and tests before implementation.

| Existing v1 mount | Proposed v2 mount | Router relative to `hrms/back-end` |
|---|---|---|
| `/api/users` | `/api/v2/users` | `src/modules/users/user.routes.js` |
| `/api/organizations` | `/api/v2/organizations` | `src/modules/organizations/organization.routes.js` |
| `/api/roles` | `/api/v2/roles` | `src/modules/roles/role.routes.js` |
| `/api/permissions` | `/api/v2/permissions` | `src/modules/permissions/permission.routes.js` |
| `/api/employees` | `/api/v2/employees` | `src/modules/employees/employee.routes.js` |
| `/api/agents` | `/api/v2/agents` | `src/modules/agent/agent.routes.js` |
| `/api/monitor` | `/api/v2/monitor` | `src/modules/monitorUpdates/monitorUpdates.routes.js` |
| `/api/departments` | `/api/v2/departments` | `src/modules/departments/department.routes.js` |
| `/api/designations` | `/api/v2/designations` | `src/modules/designations/designation.routes.js` |
| `/api/leave-types` | `/api/v2/leave-types` | `src/modules/leaveTypes/leaveType.routes.js` |
| `/api/leaves` | `/api/v2/leaves` | `src/modules/leaves/leave.routes.js` |
| `/api/holidays` | `/api/v2/holidays` | `src/modules/holidays/holiday.routes.js` |
| `/api/week-offs` | `/api/v2/week-offs` | `src/modules/weekOffs/weekOff.routes.js` |
| `/api/shifts` | `/api/v2/shifts` | `src/modules/shifts/shift.routes.js` |
| `/api/approval-flows` | `/api/v2/approval-flows` | `src/modules/approvalFlows/approvalFlow.routes.js` |
| `/api/leave-balances` | `/api/v2/leave-balances` | `src/modules/leaveBalances/leaveBalance.routes.js` |
| `/api/timesheets` | `/api/v2/timesheets` | `src/modules/timesheets/timesheet.routes.js` |
| `/api/org-settings` | `/api/v2/org-settings` | `src/modules/orgSettings/orgSettings.routes.js` |
| `/api/organization-documents` | `/api/v2/organization-documents` | `src/modules/organizationDocuments/organizationDocuments.routes.js` |
| `/api/notifications` | `/api/v2/notifications` | `src/modules/notifications/notification.routes.js` |
| `/api/expenses` | `/api/v2/expenses` | `src/modules/expenses/expense.routes.js` |
| `/api/projects` | `/api/v2/projects` | `src/modules/projects/project.routes.js` |
| `/api/hiring` | `/api/v2/hiring` | `src/modules/hiring/hiring.routes.js` |
| `/api/dashboard` | `/api/v2/dashboard` | `src/modules/dashboard/dashboard.routes.js` |
| `/api/payroll` | `/api/v2/payroll` | `src/modules/payroll/payrollAttendance.routes.js` |
| `/api/activity` | `/api/v2/activity` | `src/modules/activity/activity.routes.js` |

## Additional registrations and contracts

- Agent routes mount nested screenshot, monitor-settings, upload and health routers. Traverse them; one mount is not one endpoint.
- Payroll includes attendance, settings, components/profiles, runs, approvals, payslips and reporting handlers within its mounted router. Do not scope migration to the router filename.
- FCM integration mounts routes directly through `src/integrations/fcm/index.js`; inventory those separately instead of assuming all HTTP paths appear in the table.
- Socket.IO setup in `src/realtime/socket.js` defines a separate client/event contract. Record authentication, rooms, payloads and emitted side effects.
- Operational routes include `/`, `/health`, `/ready`, conditional `/metrics` and conditional Swagger UI. Define independent v2 equivalents without changing v1.
- Search recursively for nested router registrations and integration-mounted endpoints before declaring complete coverage. Helpers/models that are not mounted do not automatically create public endpoints.

## Endpoint record

For each resolved endpoint record v1 method/path, v2 method/path, source, authentication/permission rules, validation limits, success/error schemas/statuses, data stores, transaction boundary, provider/job effects, compatibility differences, tests and migration state. States should distinguish inventoried, implemented, verified and client migrated.

Use the [feature template](../../../../docs/engineering/templates/FEATURE-SPEC.md). No endpoint may be counted as complete solely because its parent mount is listed here.
