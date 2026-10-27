# V2 API migration specification

Status: requirements recorded; implementation not started. Date: 26 October 2026.

## User-selected requirements

- Create a separate v2 implementation of all backend API capabilities using Node.js and Fastify, following the engineering standards.
- Use Prisma for PostgreSQL and preserve the existing databases and data.
- Leave v1 behavior and implementation otherwise untouched. Existing HRMS Express APIs are explicitly namespaced under `/api/v1`; the desktop Fastify v1 API retains its existing route paths. The user will migrate clients to v2; creating v2 does not authorize switching traffic, retiring v1 or deploying.

This document updates the code-generation target. It is not evidence that any endpoints, Prisma schemas or deployment resources already exist.

## Implementation defaults

Retain JavaScript and the two independently deployable service responsibilities: HRMS and monitor ingestion. Retain Mongoose for existing MongoDB collections. These defaults minimize unrelated language, database and deployment changes; they are not additional framework choices made by the user.

Proposed new layout:

```text
v2/
  README.md
  hrms-api/
    package.json
    package-lock.json
    src/
      app.js
      server.js
      plugins/
      modules/
      repositories/
    tests/
  monitor-api/
    package.json
    package-lock.json
    src/
      app.js
      server.js
      plugins/
      modules/
      repositories/
    tests/
  database/
    README.md
    prisma/
```

This tree is a documentation proposal, not scaffolding. Define the packaging and generation of Prisma clients per logical database after inspecting actual monitor/payroll database and tenant-schema usage. Each deployable service must contain or install its required generated client without importing files from a running v1 service. The shared database directory establishes a place to document canonical schema ownership; it does not imply one client can represent all database topologies.

## V1 isolation

Treat `hrms/back-end` and `desktop/backend` as v1 migration references. HRMS Express routes use `/api/v1`; desktop Fastify routes retain their existing paths. Do not upgrade v1 dependencies, convert imports, mount v2 inside v1 servers or change root scripts to redirect execution. New launch/configuration/test files belong under `v2/`.

V2 must have independent dependency installation, configuration validation, ports and process lifecycle. Assign non-conflicting ports and document them when implementing; do not assume hosted routing exists. Use `/api/v2` as the proposed v2 API namespace and maintain an explicit route mapping. HRMS Express v1 uses `/api/v1`; desktop Fastify v1 retains its existing paths.

Keep existing callers, agent endpoints, scheduled tasks, workers and webhook destinations on v1 until explicitly migrated. During coexistence, prevent v1 and v2 from independently running the same scheduled job or processing the same effect twice. Define worker ownership before enabling v2 background processing.

## Functional scope and endpoint inventory

“All APIs” includes HRMS modules, authentication/session flows, organization/employee permissions, monitor reads, payroll APIs and monitor ingestion. Include uploads/downloads, webhooks, realtime integration, scheduled jobs and administrative scripts in the dependency inventory where they support API behavior. Do not interpret a health endpoint or partial scaffold as completion.

Use the repository [V1 module inventory](V1-MODULE-INVENTORY.md) as the module-level checklist: 26 HRMS Express route groups (including nested agent and FCM handlers) and 6 desktop Fastify route groups. It also records HRMS modules without standalone route mounts and supporting system behavior. Expand each group into individual endpoints and contracts before implementation; these counts are not endpoint coverage.

Before implementation, enumerate every mounted route and middleware chain from both v1 services. Create a v2 endpoint matrix containing:

| Field | Required evidence |
|---|---|
| V1 service, method and path | Actual registration and source location |
| V2 method and path | Explicit version mapping |
| Authentication and permissions | Session, organization, employee, device and role rules |
| Request/response contract | Headers, payloads, statuses, errors, pagination, file/stream behavior |
| Persistence and side effects | MongoDB/PostgreSQL models, transactions, providers, jobs and events |
| Test evidence | Contract/parity, authorization and failure tests |
| Migration state | Inventoried, implemented, verified, client migrated; use actual status |

The inventory is an implementation deliverable, not completed by this document. Record deliberate contract changes explicitly rather than allowing accidental framework differences.

## Fastify implementation requirements

Use function-first route plugins, controllers, services and repositories with explicit dependency injection. Separate application construction from listening so tests can instantiate the application independently. Adapt authentication, validation, error mapping, rate limiting, CORS, multipart uploads, OpenAPI and realtime integration to Fastify while preserving behavior.

Validate and bound untrusted inputs. Verify that response serialization does not omit required fields or leak internal data. Preserve cookie/header behavior, authentication failures, revoked sessions, ownership checks and safe error correlation. Keep secrets out of responses and diagnostic artifacts. Release database clients and background resources during graceful shutdown.

Do not blindly copy Express middleware signatures or import an existing server that starts listening as a side effect. Preserve testable domain behavior without introducing a runtime dependency on v1 application internals.

## Existing databases and Prisma

- Keep MongoDB data in its current databases/collections through Mongoose. Preserve identifiers, validation, indexes and tenant scoping.
- Use Prisma for all v2 application PostgreSQL persistence, including monitor and payroll access where present. Inventory connection routing and tenant schemas before choosing client/schema organization.
- Preserve existing physical schema names, tables, columns, native types, constraints, defaults, indexes, relations and records. Explicitly map differences between Prisma model names and physical names.
- Review unsupported or specialized database features and SQL operations. Use tested, parameterized Prisma raw-query facilities when necessary; document exceptions rather than retaining a parallel direct application `pg` access path. Underlying driver dependencies required by the selected Prisma version are not a second application persistence layer.
- Inventory historical payroll migrations and monitor startup DDL. Define one migration owner per physical schema. V2 must not apply overlapping migrations or race v1 schema initialization.
- Establish and validate a baseline against an isolated representative database copy. Do not reset existing databases, recreate populated schemas or use destructive synchronization as onboarding.
- Preserve transaction semantics, isolation, concurrency, duplicate handling, tenant ownership and SQL numeric/date serialization. MongoDB and PostgreSQL writes do not become one atomic transaction by adopting Prisma.
- Bound connection pools across both versions and all service instances. Prisma clients need explicit lifecycle ownership; do not create a new client per request.

Schema changes are not inherently required for framework/ORM adoption. Any unavoidable change needs a separately reviewed additive, v1-compatible plan, restore evidence and deployment coordination. Version-specific Prisma setup, client generation, adapter and migration commands must be verified against the selected supported versions during implementation, not guessed from this document.

## Incremental delivery and evidence

1. Inventory all v1 routes, persistence paths, side effects and database ownership. Record observable behavior with isolated fixtures.
2. Create independently runnable v2 services and configuration contracts. Select and pin compatible Node/Fastify/Prisma versions without changing v1 dependencies.
3. Establish Prisma mappings, baseline strategy and repository tests against isolated databases; retain Mongoose models with parity tests.
4. Implement authentication/authorization foundations and then feature modules in reviewable slices. Track every endpoint in the inventory.
5. Compare v1 and v2 on equivalent synthetic fixtures for response meaning, errors, authorization and persisted effects. Use separate test databases to avoid duplicate writes; define tolerances for nondeterministic IDs/times.
6. Exercise ingestion retries, ordering, session revocation, screenshot ownership/provider verification, payroll calculations, concurrency and recovery where applicable. Run relevant performance and resource checks.
7. Verify complete inventory coverage, independent startup/shutdown, unchanged v1 artifacts and shared-schema compatibility. Document v2 commands only after they exist and pass.
8. Prepare client migration instructions and recovery mapping. The user chooses when to move callers. Never automatically redirect or retire v1.

## Completion and recovery

V2 is migration-ready only when every in-scope endpoint and supporting behavior has verified parity or an explicitly documented versioned change, applicable standards gates pass, and both services can coexist without conflicting writes/jobs/schema management. A remaining module is an explicit gap, not silently out of scope.

Keep v1 operational as the fallback while preserving data compatibility. Reverting client routing does not undo v2 database writes, notifications or jobs; recovery must account for those effects and avoid replaying completed operations. Retain migration evidence and known limitations. Production verification remains a separate gate from code completion.

## Service-specific specifications

The [desktop backend specification set](../../desktop/backend/docs/engineering/README.md) records the inspected monitor API routes, database tables and implementation/test requirements. The [HRMS specification set](../../hrms/back-end/docs/engineering/README.md) includes its mount inventory and persistence/test requirements; full endpoint-level enumeration remains implementation preparation.
