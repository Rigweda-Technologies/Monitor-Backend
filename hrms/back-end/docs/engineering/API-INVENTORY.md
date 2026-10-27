# HRMS API mount inventory

Source: `hrms/back-end/src/routes/apiV1.js` and `app.js`, updated 27 October 2026. This is a mount-level inventory, not a complete endpoint or field-level contract inventory. HRMS Express v1 mounts now use `/api/v1`; every row is **inventoried only** for v2, which is not implemented.

See the repository [V1 module inventory](../../../../docs/engineering/V1-MODULE-INVENTORY.md) for the combined HRMS and desktop module checklist and supporting modules.

Current HRMS Express routes use `/api/v1`. Update integrations that call HRMS to use this prefix. Proposed v2 routes use `/api/v2` in the independent HRMS service. Expand each router into its HTTP methods, nested paths, middleware, permissions, request/response fields, statuses, data dependencies and tests before implementation.

The previous unversioned HRMS business paths are not retained as aliases. Client base URLs must include `/api/v1` before the server change is released. Operational endpoints (`/`, `/health`, `/ready`, `/metrics`) and Swagger UI remain outside the versioned business API namespace.

| Existing v1 mount | Proposed v2 mount | Router relative to `hrms/back-end` |
|---|---|---|
| `/api/v1/users` | `/api/v2/users` | `src/modules/users/user.routes.js` |
| `/api/v1/organizations` | `/api/v2/organizations` | `src/modules/organizations/organization.routes.js` |
| `/api/v1/roles` | `/api/v2/roles` | `src/modules/roles/role.routes.js` |
| `/api/v1/permissions` | `/api/v2/permissions` | `src/modules/permissions/permission.routes.js` |
| `/api/v1/employees` | `/api/v2/employees` | `src/modules/employees/employee.routes.js` |
| `/api/v1/agents` | `/api/v2/agents` | `src/modules/agent/agent.routes.js` |
| `/api/v1/monitor` | `/api/v2/monitor` | `src/modules/monitorUpdates/monitorUpdates.routes.js` |
| `/api/v1/departments` | `/api/v2/departments` | `src/modules/departments/department.routes.js` |
| `/api/v1/designations` | `/api/v2/designations` | `src/modules/designations/designation.routes.js` |
| `/api/v1/leave-types` | `/api/v2/leave-types` | `src/modules/leaveTypes/leaveType.routes.js` |
| `/api/v1/leaves` | `/api/v2/leaves` | `src/modules/leaves/leave.routes.js` |
| `/api/v1/holidays` | `/api/v2/holidays` | `src/modules/holidays/holiday.routes.js` |
| `/api/v1/week-offs` | `/api/v2/week-offs` | `src/modules/weekOffs/weekOff.routes.js` |
| `/api/v1/shifts` | `/api/v2/shifts` | `src/modules/shifts/shift.routes.js` |
| `/api/v1/approval-flows` | `/api/v2/approval-flows` | `src/modules/approvalFlows/approvalFlow.routes.js` |
| `/api/v1/leave-balances` | `/api/v2/leave-balances` | `src/modules/leaveBalances/leaveBalance.routes.js` |
| `/api/v1/timesheets` | `/api/v2/timesheets` | `src/modules/timesheets/timesheet.routes.js` |
| `/api/v1/org-settings` | `/api/v2/org-settings` | `src/modules/orgSettings/orgSettings.routes.js` |
| `/api/v1/organization-documents` | `/api/v2/organization-documents` | `src/modules/organizationDocuments/organizationDocuments.routes.js` |
| `/api/v1/notifications` | `/api/v2/notifications` | `src/modules/notifications/notification.routes.js` |
| `/api/v1/expenses` | `/api/v2/expenses` | `src/modules/expenses/expense.routes.js` |
| `/api/v1/projects` | `/api/v2/projects` | `src/modules/projects/project.routes.js` |
| `/api/v1/hiring` | `/api/v2/hiring` | `src/modules/hiring/hiring.routes.js` |
| `/api/v1/dashboard` | `/api/v2/dashboard` | `src/modules/dashboard/dashboard.routes.js` |
| `/api/v1/payroll` | `/api/v2/payroll` | `src/modules/payroll/payrollAttendance.routes.js` |
| `/api/v1/activity` | `/api/v2/activity` | `src/modules/activity/activity.routes.js` |

## Additional registrations and contracts

- Agent routes mount nested screenshot, monitor-settings, upload and health routers. Traverse them; one mount is not one endpoint.
- Payroll includes attendance, settings, components/profiles, runs, approvals, payslips and reporting handlers within its mounted router. Do not scope migration to the router filename.
- FCM integration contributes device-token routes under the shared `/api/v1/notifications` mount through `src/integrations/fcm/index.js`; include those nested handlers when expanding this inventory.
- Socket.IO setup in `src/realtime/socket.js` defines a separate client/event contract. Record authentication, rooms, payloads and emitted side effects.
- Operational routes include `/`, `/health`, `/ready`, conditional `/metrics` and conditional Swagger UI. Define independent v2 equivalents without changing v1.
- Search recursively for nested router registrations and integration-mounted endpoints before declaring complete coverage. Helpers/models that are not mounted do not automatically create public endpoints.

## Endpoint record

For each resolved endpoint record v1 method/path, v2 method/path, source, authentication/permission rules, validation limits, success/error schemas/statuses, data stores, transaction boundary, provider/job effects, compatibility differences, tests and migration state. States should distinguish inventoried, implemented, verified and client migrated.

Use the [feature template](../../../../docs/engineering/templates/FEATURE-SPEC.md). No endpoint may be counted as complete solely because its parent mount is listed here.
