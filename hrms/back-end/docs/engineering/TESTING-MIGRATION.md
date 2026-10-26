# HRMS v2 testing and migration

Status: required future evidence, not executed test results. Existing tests under `hrms/back-end/tests` are behavior references. `npm test --prefix hrms/back-end` runs v1; do not label that output v2 verification.

## Verification areas

| Area | Required evidence |
|---|---|
| Identity and permissions | Login/session behavior, revocation, password restrictions, role/permission changes, tenant isolation and privilege escalation denial |
| Employees/organizations | Validation, identity/reference stability, resource ownership and query filtering |
| Attendance/leave/timesheets | Date/timezone boundaries, balances, approval lifecycle, overrides, locks and concurrent changes |
| Payroll | Formula/rounding parity, component effective dates, snapshots, provisioning, profile validation, run lifecycle, approvals, idempotency and reporting |
| Agent/monitor | Settings secret isolation, upload/completion ownership, provider asset checks, signed delivery and shared-data read compatibility |
| Documents/expenses/projects/hiring | Lifecycle and authorization contracts, file handling, pagination and failure cases |
| Notifications/realtime/jobs | Authorized subscriptions, provider failures, retries, deduplication and single scheduler/worker ownership |
| Persistence | Real MongoDB/PostgreSQL fixtures, Prisma constraints/transactions, serialization, tenant routing and unchanged schema compatibility |
| Service lifecycle | Independent startup/shutdown, validated configuration, readiness, safe errors, CORS, rate limits and resource budgets |

Extend the matrix per endpoint; listed families do not replace full route coverage. Read existing payroll, attendance, screenshot and expense regression tests for concrete cases.

## Test design

Use function-level tests with injected dependencies, Fastify application injection for HTTP contracts, and real isolated databases for persistence boundaries. Stub unreliable providers with separate contract checks. Never use production databases or real employees as fixtures. Report skips, missing required checks and failures explicitly.

Compare v1/v2 behavior using equivalent synthetic datasets in separate databases. Verify request/response meaning, status/error behavior and persisted side effects. Record tolerances for generated IDs/times. Security improvements must be explicit versioned differences rather than silently reproducing unsafe behavior.

## Migration sequence

1. Expand the mount inventory into every endpoint, middleware chain, data dependency and side effect.
2. Establish independent lifecycle/configuration/authentication with Fastify.
3. Validate Mongoose parity and Prisma mappings/baseline strategy for actual database topology.
4. Implement modules incrementally with contract, authorization and real-database evidence.
5. Verify cross-service monitor compatibility, realtime clients, jobs and provider recovery.
6. Reconcile all inventory rows; document actual v2 commands and migration instructions after testing them.
7. Let the user migrate clients. Keep v1 code/routes/startup and shared data compatibility intact.

Use the [review/release template](../../../../docs/engineering/templates/REVIEW-AND-RELEASE.md). Capture commit/artifact identity, applicable checks, migration safety, independent review, known gaps and release/recovery ownership. Local implementation success does not establish production readiness.

Routing back to v1 does not undo payroll writes, notifications, provider uploads or jobs. Define compatible rollback or forward recovery with reconciliation. Do not enable duplicate schedulers or blindly reverse schema/data changes.
