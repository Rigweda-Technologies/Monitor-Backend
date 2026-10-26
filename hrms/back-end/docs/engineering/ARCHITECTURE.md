# HRMS v2 architecture

Reference: `hrms/back-end/app.js`, `src/modules`, `src/middlewares`, `src/config`, `src/payroll`, `src/jobs`, `src/realtime` and `src/integrations`. Observations below are source-derived, not runtime verification.

## Current responsibilities

HRMS v1 is CommonJS Express. It serves identity and active-session checks, organization/employee management, permissions, attendance/leave/timesheets, expenses/projects/hiring, payroll, notifications and monitor/agent APIs. It connects to MongoDB, conditionally enabled payroll PostgreSQL and optional Redis; monitor PostgreSQL is also accessed by monitor features.

The application entrypoint starts connections, realtime integration, bootstrap/permission synchronization and optional scheduling. Importing it is not a safe way to reuse domain logic in v2.

## Target organization

Create `v2/hrms-api` with independent dependencies, lockfile, configuration, tests and startup. Keep JavaScript; module-system selection for the new service must be explicit and consistent, without converting v1 files.

- Application factory: constructs Fastify with injected configuration, repositories and integrations; does not listen or mutate schemas.
- Server entrypoint: validates settings, initializes resources, listens on a separate port and implements graceful shutdown.
- Plugins/hooks: authentication, permission enforcement, validation, safe errors, correlation, CORS, rate limits and OpenAPI.
- Feature modules: function-first routes/controllers/services; keep business rules separate from HTTP and persistence.
- Repositories: Mongoose for MongoDB, Prisma for PostgreSQL; transactions follow business operations.
- Integrations/jobs: explicit bounded provider calls and independently controlled realtime/worker lifecycle.

Preserve the two API service boundaries. HRMS v2 and desktop v2 must not depend on deployment of each other before their contracts are ready. Do not import running v1 entrypoints or mutate v1 model definitions through shared initialization.

## Authentication and middleware migration

Inventory existing middleware order and permissions for each route. Fastify hooks must preserve session revocation, password-change restrictions, organization scope, active roles and resource-level checks. A successfully decoded JWT alone is insufficient authentication. Preserve `/users/me/profile` behavior needed by monitor callers at the documented v2 route, while v1 callers remain unchanged.

Translate Express request/response and async error conventions deliberately. Test headers, cookies where used, proxy trust, CORS, rate limits, validation coercion, error envelopes, uploads/downloads and response serialization. Keep public errors safe; never copy password/token logging from bootstrap or unexpected errors into v2.

## Configuration and side effects

Use independent validated v2 settings for MongoDB, monitor/payroll PostgreSQL, Redis, authentication, provider integrations, host/port and feature toggles. Do not read real v1 secret files or silently load hosted defaults for tests. Preserve required encryption/token compatibility through securely provisioned configuration, not copied credentials in documentation.

V1 readiness considers MongoDB and enabled Redis/payroll dependencies. V2 must explicitly define its required dependencies, disabled-feature behavior and safe readiness output. Keep liveness separate. Expose metrics/docs according to explicit configuration.

Do not automatically run bootstrap, seed permissions, schema initialization or background schedules on ordinary v2 startup. Inventory these effects and assign a single owner during coexistence. Prevent duplicate payroll jobs, notifications and schedules. Preserve Socket.IO client protocols and authorized subscriptions through an explicit realtime adapter; changing HTTP frameworks alone does not migrate those contracts.
