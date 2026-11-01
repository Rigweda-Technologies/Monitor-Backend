# HRMS v2 migration tracker

## Route coverage

The source of truth is `tests/fixtures/v1-api-route-manifest.json`, regenerated with `scripts/export-v1-route-manifest.cjs`. It records **251 V1 registrations / 250 unique method-path operations** (one duplicate registration). `tests/v1-route-completeness.test.js` asserts every unique operation is registered in the V2 app and generated OpenAPI, and that V2 has no untracked business routes. Every group below is implemented and wired into the V2 app. “Implemented” does not mean direct request/response parity has been proven for every operation. Current curated suite references reflect targeted executed parity evidence, not exhaustive endpoint-level equivalence.

`tests/fixtures/v1-api-migration-ledger.json` maps each unique operation to its V1 route source, V2 route module, and test references. Regenerate it with `node scripts/build-migration-ledger.cjs` after refreshing the route manifest. All **250 rows** point to curated module parity suites. These references are navigation aids, not proof that each listed operation or behavior is covered; inspect the named suite for its actual status, body, header, side-effect, authorization and failure assertions. The generator maps auth, user-administration, supporting-domain, and dashboard routes to their existing suites. The automated completeness test checks ledger keys, route/OpenAPI presence, evidence-label boundaries and source/path consistency against the manifest.

| V1 mount | Unique operations | V2 area | State |
|---|---:|---|---|
| `/api/v1/users` | 15 | auth and user administration | Implemented |
| `/api/v1/organizations` | 7 | organizations | Implemented |
| `/api/v1/roles` | 6 | roles | Implemented |
| `/api/v1/permissions` | 1 | permissions | Implemented |
| `/api/v1/employees` | 14 | employees | Implemented |
| `/api/v1/agents` | 16 | agents and monitor persistence | Implemented |
| `/api/v1/monitor` | 5 | monitor updates | Implemented |
| `/api/v1/departments` | 5 | departments | Implemented |
| `/api/v1/designations` | 4 | designations | Implemented |
| `/api/v1/leave-types` | 4 | leave types | Implemented |
| `/api/v1/leaves` | 9 | leaves and approvals | Implemented |
| `/api/v1/holidays` | 4 | holidays | Implemented |
| `/api/v1/week-offs` | 3 | week-offs | Implemented |
| `/api/v1/shifts` | 5 | shifts | Implemented |
| `/api/v1/approval-flows` | 4 | approval flows | Implemented |
| `/api/v1/leave-balances` | 4 | leave balances | Implemented |
| `/api/v1/timesheets` | 28 | attendance and timesheets | Implemented |
| `/api/v1/org-settings` | 4 | organization settings | Implemented |
| `/api/v1/organization-documents` | 11 | organization documents | Implemented |
| `/api/v1/notifications` | 6 | notifications and FCM tokens | Implemented |
| `/api/v1/expenses` | 14 | expenses and vendors | Implemented |
| `/api/v1/projects` | 6 | projects | Implemented |
| `/api/v1/hiring` | 16 | hiring | Implemented |
| `/api/v1/dashboard` | 1 | dashboard | Implemented |
| `/api/v1/payroll` | 53 | payroll | Implemented |
| `/api/v1/activity` | 5 | activity | Implemented |
| **Total** | **250** |  |  |

V2 operational routes (`/`, `/api/v2/health`, `/api/v2/ready`) are separately documented in OpenAPI. OpenAPI currently has 198 paths because several paths carry multiple methods.

## Contract and runtime verification

- Direct comparisons cover all 13 auth/session operations; organization, user-administration, role, permission and dashboard routes; organization soft-delete/restore also compares real V1/V2 service effects, token state, shared-member preservation, and wrong-confirmation no-mutation; real V1/V2 user creation services compare response plus user, membership, employee and leave-initialization side effects; all 53 payroll routes for status/message and permission denial plus Joi validation parity over all declared top-level and one-level nested fields using valid, boundary, null and malformed values, and representative response fixtures; PostgreSQL payroll provisioning failure/success, pay-group list/detail/update with persisted schedule fields; salary-component create/list/detail/update/archive with persisted fields and archived state; employee payroll profile create/upsert/get/update/delete with persisted fields and upsert ID stability; profile bank-detail version updates, statutory details, and salary-structure create/revise/deactivate with persisted effects; run preview/create/compute/breakdown, validation failure with unchanged persisted state, admin payslip by run/month, and all five reports compared through real V1/V2 PostgreSQL-backed services (including bank-transfer CSV), submit/approve/lock/reopen and audit-trail responses plus persisted lifecycle/audit rows, including the rejected attempt to lock a reopened draft (HTTP 409) with unchanged persisted state; all 21 organization-settings/documents/notifications routes including notification pagination, unread filtering/count, cross-organization scoping, and FCM token idempotent registration/platform update/cross-organization ownership transfer; 58 guarded paths across employees, designations, departments, expenses, projects and hiring plus employee `/leave-types`; employee routes including profile, export, bulk update, confirmation, both termination actions, profile reopen and employee/designation/department CRUD; all 14 expense operations and all six project operations with response and persisted-effect comparisons; all 16 hiring operations with response, persistence, audit and injected-provider comparisons; all 16 agent routes for authorization denial and injected-provider success plus all five monitor-update routes; all 24 leave-type/balance, holiday, week-off, shift and approval-flow paths for missing-auth plus validation, seeded reads and 15 successful writes; leaves/activity auth, validation, reads and successful apply/approval/rejection/reversal; foreign-organization leave action is denied by V2 without mutation, while V1 leaks an internal 500 due to an unscoped ID lookup (V2 intentionally returns generic “Leave not found” per ownership/security requirements); and timesheet missing-auth responses for all 28 routes plus attendance/list/default reads, check-in/out, attendance request create/reject, weekly list/create/edit/submit/approval and recall, individual and bulk attendance overrides, lock-month, and custom bulk override workflows. Supporting-domain successful reads now compare leave-type and holiday lists, employee and personal leave balances, week-off list/all, shift list/personal assignment, and approval-flow lists from seeded records. Attendance matrix history reads now compare successfully for both the employee-specific and self routes against a seeded attendance row.
- Each migrated group has route, validation, permission, service or isolated-Mongo coverage in its module test files. The checks do not compare every success/error path of all 250 operations, so blanket payload/status parity is **not yet proven**.
- Latest full V2 run after expanded timesheet and supporting-domain read comparisons: see VERIFICATION.md for the run result, command inputs and evidence boundaries.
- Agent-monitor repository integration exercises encrypted settings, upload batch/item completion and ownership, provider-verification failure rollback, screenshot reads, and device health against V1 Monitor table DDL plus the existing HRMS V1 Cloudinary three-column upgrade. It also exercises the expanded settings-column shape. V2 detects optional Cloudinary setting columns and preserves V1 default response values when they are absent; it does not alter shared schema.
- Monitor and payroll Prisma schemas validate and generate. The Prisma payroll integration test ran against the 11 V1 payroll migrations applied to disposable local databases and verified parameterized queries, transaction commit/rollback, tenant-scoped clearing and tenant deletion. On the current V1-migrated schema, V1 and V2 pay-group provisioning return the same 500 envelope/message for PostgreSQL `42P10` and roll back tenant creation, matching the user's explicit compatibility choice. On a separate legacy-compatible disposable index shape, both provision successfully; the lifecycle integration compares payroll run create/preview/compute/breakdown, approval lifecycle and audit responses, plus persisted run, employee, component and audit rows using equivalent fixtures. V2 converts PostgreSQL `int8` results to decimal strings, matching node-postgres and keeping audit payloads JSON serializable; PostgreSQL date-column `Date` values serialize as ISO timestamps to match V1 wire responses. V1 source remains unchanged.
- `npm audit --omit=dev` reported **0 vulnerabilities**; `git diff --check` is clean.
- Live queue, Redis Socket.IO fan-out, email, Firebase, Face++, Cloudinary and R2 delivery were not exercised. No deployment or client cutover occurred; callers remain on V1.

## Supporting behavior

| Area | V2 implementation | Boundary |
|---|---|---|
| MongoDB | Existing collections remain Mongoose-backed; automatic index/collection creation is disabled. | Existing indexes and physical collection compatibility remain deployment prerequisites. Carry-forward uses an additive retry marker on existing leave-balance documents. |
| PostgreSQL | Separate Prisma monitor and payroll clients; parameterized raw SQL where needed. | Payroll query/transaction and tenant-cleanup paths and payroll run create/compute lifecycle were exercised against disposable local schemas produced from existing V1 migrations. Agent-monitor repository paths run against disposable V1-initialized Monitor tables. Optional HRMS V1 settings columns are not guaranteed by the desktop initializer; V2 tolerates absent optional columns and returns legacy defaults. No V2 or production schema migration was run. |
| Realtime | Injected Socket.IO event bridge preserves v1 rooms and event names; disabled by default. | Caller owns the Socket.IO server, CORS/path and any Redis adapter. No second server starts. |
| Jobs | Five HRMS job handlers plus payroll compute processor; injected queue/worker/scheduler adapters preserve existing names and schedules and expose attendance auto-checkout. | Nothing starts automatically. Attendance auto-checkout came from an unreferenced V1 node-cron file; caller must establish V1 launch state and assign a single V1/V2 owner before enabling it. |
| Notifications | FCM token APIs, best-effort push and realtime event injection; document-expiry notifications use the notification service. | External delivery was not exercised. |
| Startup/bootstrap | Independent Fastify runtime, readiness and graceful database shutdown; explicit SYSTEM bootstrap, dry-run-first role-seeding, and payroll tenant sync commands. | Bootstrap, role seeding, and tenant synchronization are never automatic on V2 startup. Other one-off schema/data repair scripts are not ported; assess them individually before sharing a database. |

V1 module-scope cron files for attendance auto-checkout and leave/probation work have no source import references; their deployed launch state is unknown. V2 now exposes attendance auto-checkout as an opt-in queue job, but its launch state and exclusive ownership must be confirmed before enabling it. Leave/probation work is covered by the four-job BullMQ path; operators must still prevent duplicate ownership from any separately loaded V1 cron.

## State definitions

- **Implemented:** route and service are wired in the V2 application and route/OpenAPI completeness passes.
- **Verified:** the applicable behavior is covered by an executed test; this label is evidence-specific, not a blanket parity claim.
- **Client migrated:** a caller is intentionally moved in a separately authorized change.

No client migration, production deployment or V2/production schema migration was performed or is authorized by this tracker. Existing V1 payroll migrations were applied only to a disposable local test database.
