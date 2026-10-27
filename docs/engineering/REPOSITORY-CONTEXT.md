# Repository context for generation

Observed from tracked files on 26 October 2026. This is a structural snapshot, not a runtime health or compliance assessment. Recheck package scripts and nearby code before implementation.

## Selected v2 target

The existing code described below is v1. HRMS Express routes use `/api/v1`; desktop Fastify v1 routes retain their existing paths. Keep v1 behavior and service lifecycle stable while allowing the explicitly requested HRMS URL prefix and required client URL updates. The user selected a separate Node.js/Fastify v2 using Prisma for PostgreSQL and preserving existing databases. MongoDB continues through Mongoose. See [V2-API-SPEC.md](V2-API-SPEC.md) for isolation, compatibility, migration gates and proposed directories. V2 is specified, not implemented. Existing commands below run v1 only.

Use the [V1 module inventory](V1-MODULE-INVENTORY.md) as the module-level V2 migration checklist. It distinguishes registered business route groups, nested HRMS agent/FCM routes, non-route HRMS modules and desktop Fastify modules.

## Current v1 services and boundaries

| Service | Runtime conventions | Responsibility | Relevant paths |
|---|---|---|---|
| HRMS API | JavaScript, CommonJS, Express; entry `app.js` | HRMS, authorization, monitor read APIs, payroll integration | `hrms/back-end/src/modules`, `src/middlewares`, `src/validations`, `src/payroll`, `tests` |
| Monitor ingestion API | JavaScript, ESM, Fastify; entry `src/server.js` | Monitor ingestion and screenshot/activity metadata | `desktop/backend/src/modules`, `src/middleware`, `src/database`, `src/routes`, `tests` |

Paths in the last column are relative to the indicated service. HRMS uses MongoDB and PostgreSQL integrations; monitor ingestion uses PostgreSQL. Both services must use the same monitor database. Preserve independently deployable service roots and existing cross-service tests. Frontend and desktop-agent implementation belong to sibling repositories, not this checkout.

Existing monitor modules use routes, validation, controller, service and model files. A model containing database access serves the repository responsibility described by the handbook; a mass rename is unnecessary. Inspect the nearest module before choosing filenames. Preserve CommonJS versus ESM imports.

## Existing commands

Run from repository root unless stated otherwise:

| Purpose | Existing command |
|---|---|
| Locked install of both APIs | `npm run setup` |
| Both API test suites | `npm test` |
| HRMS tests only | `npm test --prefix hrms/back-end` |
| Monitor tests only | `npm test --prefix desktop/backend` |
| Local APIs | `npm run local` |
| HRMS only | `npm run hrms:local` |
| Monitor only | `npm run desktop:local` |
| Payroll migration status | `npm run migrate:payroll:status --prefix hrms/back-end` |

Tests use Node's built-in test runner. Root README currently requires Node.js 22.11+; exact CI pinning is pending. Local API ports are 8000 and 3001. `npm run server` runs local processes with hosted-mode configuration; it is not a deployment command. Do not use it as an isolated-test substitute.

Ownership integration tests use `MONITOR_OWNERSHIP_TEST_URL` pointing to a disposable/local PostgreSQL database. Supply it securely outside documentation. Inspect test setup and fixture cleanup before running database-dependent tests. A skipped database test is not passing integration evidence.

## Compatibility and security constraints

- Preserve organization/employee/device/batch ownership on screenshot operations and active-session verification between APIs.
- Monitor secrets are server-side. Preserve signed upload/delivery and provider-asset verification behavior when changing those paths.
- Coordinated changes to duplicated cross-service behavior must keep both implementations and their regression tests consistent; do not create an undeclared cross-deployment import dependency.
- Read configuration contracts from examples and configuration code. Real `.env` files, `env.text`, dumps, logs and `.verification` artifacts may contain secrets or personal data and must not become generated fixtures or documentation.
- Existing payroll migration scripts and `src/payroll/migrations` are implementation context. Inspect monitor schema initialization before proposing versioned migrations; documentation alone does not replace it.
- Prefer root environment guidance over stale pre-split examples in historical documents. Verify actual contracts in code before changing endpoints.

## Known documentation-to-implementation gaps

Package manifests inspected for this task do not define format, lint, type-check or build scripts. No tracked GitHub Actions workflow or CODEOWNERS file was found. This does not establish whether remote CI or branch protection exists; remote settings were not inspected. Do not claim these gates are implemented or passing.

TypeScript strictness is conditional on an approved TypeScript adoption scope. The handbook does not mandate a framework replacement; the user has separately selected Fastify and Prisma for a new v2, while leaving v1 unchanged. Coverage targets, scanner severity thresholds, deployment infrastructure and production approvers require decisions in [DECISIONS.md](DECISIONS.md).

## HRMS v1 CI/CD update

The preceding missing-tooling observations describe the original snapshot. The user subsequently authorized v1 CI/CD: HRMS now has lint, JavaScript type-check baseline, no-skip CI tests and production audit commands, a Dockerfile, and a GitHub production workflow. See [the runbook](../../deploy/hrms/README.md) for limits and required infrastructure. Remote branch protections and AWS resources are not established by these files.
