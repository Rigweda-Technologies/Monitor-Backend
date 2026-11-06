# V1 module inventory for V2 migration

Observed from the current V1 source on 27 October 2026. This is a source-level migration index, not proof of runtime parity or a complete field-level API contract. HRMS Express business routes use `/api/v1`; desktop Fastify V1 routes retain their current `/api` paths. V2 is planned under `/api/v2`.

## HRMS Express API modules

Each row is a registered business route group. The module path is relative to `hrms/back-end`.

| V1 route group | Module | V1 mount/source | Notes for V2 inventory |
|---|---|---|---|
| Users | `users` | `/api/v1/users` — `src/modules/users/user.routes.js` | Authentication, sessions, profiles, permissions and user administration; enumerate nested route contracts. |
| Organizations | `organizations` | `/api/v1/organizations` — `src/modules/organizations/organization.routes.js` | Organization lifecycle and tenant context. |
| Roles | `roles` | `/api/v1/roles` — `src/modules/roles/role.routes.js` | Role administration and role/permission seeding dependencies. |
| Permissions | `permissions` | `/api/v1/permissions` — `src/modules/permissions/permission.routes.js` | Permission catalog and authorization support. |
| Employees | `employees` | `/api/v1/employees` — `src/modules/employees/employee.routes.js` | Employee records, profiles, lifecycle and related lookups. |
| Agent integration | `agent` | `/api/v1/agents` — `src/modules/agent/agent.routes.js` | Includes the nested route modules below. |
| Monitor updates | `monitorUpdates` | `/api/v1/monitor` — `src/modules/monitorUpdates/monitorUpdates.routes.js` | Monitor agent update distribution. |
| Departments | `departments` | `/api/v1/departments` — `src/modules/departments/department.routes.js` | Department administration. |
| Designations | `designations` | `/api/v1/designations` — `src/modules/designations/designation.routes.js` | Designation administration. |
| Leave types | `leaveTypes` | `/api/v1/leave-types` — `src/modules/leaveTypes/leaveType.routes.js` | Leave-type administration. |
| Leaves | `leaves` | `/api/v1/leaves` — `src/modules/leaves/leave.routes.js` | Leave requests and approval behavior. |
| Holidays | `holidays` | `/api/v1/holidays` — `src/modules/holidays/holiday.routes.js` | Organization holiday administration. |
| Week offs | `weekOffs` | `/api/v1/week-offs` — `src/modules/weekOffs/weekOff.routes.js` | Weekly-off configuration. |
| Shifts | `shifts` | `/api/v1/shifts` — `src/modules/shifts/shift.routes.js` | Shift administration and assignment. |
| Approval flows | `approvalFlows` | `/api/v1/approval-flows` — `src/modules/approvalFlows/approvalFlow.routes.js` | Configurable approval chains and decisions. |
| Leave balances | `leaveBalances` | `/api/v1/leave-balances` — `src/modules/leaveBalances/leaveBalance.routes.js` | Leave balance reads and adjustments. |
| Timesheets and attendance | `timesheets` | `/api/v1/timesheets` — `src/modules/timesheets/timesheet.routes.js` | Check-in/out, attendance, requests, weekly timesheets and approvals. |
| Organization settings | `orgSettings` | `/api/v1/org-settings` — `src/modules/orgSettings/orgSettings.routes.js` | Organization configuration and appearance settings. |
| Organization documents | `organizationDocuments` | `/api/v1/organization-documents` — `src/modules/organizationDocuments/organizationDocuments.routes.js` | Document catalog, upload, access, status and reports. |
| Notifications | `notifications` | `/api/v1/notifications` — `src/modules/notifications/notification.routes.js` | Also receives the FCM device-token routes listed below. |
| Expenses | `expenses` | `/api/v1/expenses` — `src/modules/expenses/expense.routes.js` | Expense, vendor, receipt and approval behavior. |
| Projects | `projects` | `/api/v1/projects` — `src/modules/projects/project.routes.js` | Project administration and employee associations. |
| Hiring | `hiring` | `/api/v1/hiring` — `src/modules/hiring/hiring.routes.js` | Hiring/recruitment workflows. |
| Dashboard | `dashboard` | `/api/v1/dashboard` — `src/modules/dashboard/dashboard.routes.js` | Aggregated dashboard data, including monitor-agent fields. |
| Payroll | `payroll` | `/api/v1/payroll` — `src/modules/payroll/payrollAttendance.routes.js` | Large route family: setup, components, profiles, runs, approvals, payslips and reporting; inspect the complete router before porting. |
| Activity | `activity` | `/api/v1/activity` — `src/modules/activity/activity.routes.js` | Monitor activity reads and summaries. |

`src/routes/apiV1.js` is the HRMS mount registry. The `agent` domain also mounts these nested files under `/api/v1/agents`:

- `src/modules/agent/agent.screenshots.routes.js`
- `src/modules/agent/agent.monitorSettings.routes.js`
- `src/modules/agent/agent.monitorUploads.routes.js`
- `src/modules/agent/agent.health.routes.js`

`src/integrations/fcm/index.js` adds device-token handlers under `/api/v1/notifications`; include them with the notifications API when building the endpoint matrix.

## HRMS modules without a direct route mount

These folders exist under `hrms/back-end/src/modules` but are not standalone API mounts in `src/routes/apiV1.js`:

| Module | Observed role | V2 treatment |
|---|---|---|
| `auditLogs` | Audit model/service imported by multiple business services. | Preserve audit side effects with the owning business operation; inventory events and transaction boundaries. |
| `leaveCarryForward` | Service called by the leave-carry-forward job/worker. | Treat as background-job behavior; decide single-version job ownership before enabling V2 workers. |
| `employmentTypes` | Mongoose model is present; no direct route mount or source import was found in the scan. | Confirm whether this model/data is active before deciding to expose or omit an API in V2. Do not invent an endpoint. |

## Desktop monitor Fastify API modules

These routes are in `desktop/backend`; their existing V1 URLs remain unchanged. Module paths are relative to `desktop/backend`.

| V1 module | Existing V1 route(s) | Route source |
|---|---|---|
| `screenshots` | `POST /api/screenshots`; `POST /api/screenshot-batches/uploads`; `POST /api/screenshot-batches/:batchId/complete` | `src/modules/screenshots/screenshots.routes.js` |
| `activity` | `POST /api/activity-events/batch` | `src/modules/activity/activity.routes.js` |
| `appUsage` | `POST /api/app-usage/batch` | `src/modules/appUsage/appUsage.routes.js` |
| `browserHistory` | `POST /api/browser-history/batch` | `src/modules/browserHistory/browserHistory.routes.js` |
| `cloudinary` | `GET /api/cloudinary/upload-config` | `src/modules/cloudinary/cloudinary.routes.js` |
| `agents` | `POST /api/agents/location` | `src/routes/agents.js` |

The desktop service also has `config`, `database`, `integrations`, `middleware` and `scripts` source areas. These are supporting modules, not additional business route groups. HRMS profile/session validation is an external service dependency and now calls the HRMS `/api/v1` namespace.

## Cross-service and operational behavior

- HRMS has root, health, readiness, conditional metrics and Swagger routes outside the `/api/v1` business prefix. Desktop has root, health and Swagger routes outside its business API mounts.
- HRMS Socket.IO uses a separate event contract. HRMS jobs, workers, payroll migrations, scripts, FCM, Cloudinary and database initialization can produce behavior beyond request/response handlers; inventory them alongside routes when migrating each domain.
- HRMS uses MongoDB/Mongoose and PostgreSQL integrations. Desktop monitor ingestion uses PostgreSQL. Preserve each existing physical schema and record ownership; the selected V2 requirement is Prisma for PostgreSQL and retained Mongoose for MongoDB.
- V2 APIs are new, independent Fastify services under `/api/v2`; do not mount them into V1 or change current desktop Fastify route paths as part of this inventory.

## Migration tracking

Use the route tables here as the module-level checklist. Before implementing a module, expand it into individual methods and paths, middleware/permissions, request and response contracts, status/error behavior, database tables/collections, side effects, jobs, idempotency, tests and recovery. Track each endpoint as **inventoried**, **implemented**, **verified**, and **client migrated**. The current mount inventory does not establish endpoint-level parity.
