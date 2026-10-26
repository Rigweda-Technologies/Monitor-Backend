# Code generation guidance

Read [the engineering index](docs/engineering/README.md), [repository context](docs/engineering/REPOSITORY-CONTEXT.md), and the applicable sections of [the standards](docs/engineering/STANDARDS.md) before generating or changing code. Consult [open decisions](docs/engineering/DECISIONS.md) when a task depends on an unresolved policy.

## Scope and authority

These files translate the Rigweda Engineering Standards, Testing & CI/CD Handbook v1.0 (8 October 2026) into repository guidance. The source is a proposed baseline, not evidence of approved organizational policy or implemented controls. User task instructions define the authorized work; handbook examples do not authorize deployments, migrations, infrastructure changes or unrelated rewrites.

## Implementation rules

- Preserve v1 unchanged: `hrms/back-end` and `desktop/backend`, their routes, dependencies, lockfiles, configuration and startup commands. Implement the selected Node.js/Fastify v2 separately under `v2/`, following [the v2 specification](docs/engineering/V2-API-SPEC.md). Do not redirect existing clients or replace v1.
- V2 MUST use Prisma for PostgreSQL access and retain the existing MongoDB/Mongoose persistence. Preserve database names, schemas, records, identifiers and ownership semantics. Do not move MongoDB data into PostgreSQL.
- Keep v2 installation, generated clients, tests and startup independent of v1. Shared database access requires v1-compatible writes and explicit schema ownership; separate code alone does not isolate database effects.
- Use functions by default for routes, controllers, services, repositories, hooks and utilities. Explain a concrete benefit before introducing a class.
- Keep HTTP handling, business rules and persistence separate. Inject external dependencies into testable functions/factories. Follow existing module names and layout.
- Validate external inputs; derive organization, employee and device ownership from verified authentication and enforce authorization server-side.
- Keep secrets out of code, responses, logs, fixtures and documentation. Do not read or copy local secrets merely to generate code.
- Use parameterized SQL, business-operation transactions, bounded external-call timeouts and safe retry/idempotency policies.
- Add meaningful tests for changed business rules, authorization and failure paths. Reproducible bug fixes need a failing regression test before the fix.
- Use the existing `node --test` suites. Integration tests must use isolated databases; never production. Report skipped tests separately.
- Do not invent TypeScript, lint, build or CI commands. Current scripts and implementation gaps are documented in repository context.
- Fastify and Prisma for PostgreSQL are user-selected v2 requirements. Do not introduce NestJS, a message broker, a cloud provider, TypeScript migration or numerical quality targets from handbook examples. JavaScript remains the default.
- Before implementation, describe the requested behavior and relevant acceptance criteria using the [feature specification template](docs/engineering/templates/FEATURE-SPEC.md) when useful. Do not invent missing business policy.
- Before reporting completion, run applicable checks and report actual evidence, remaining gaps and migration/recovery implications. Do not claim deployment or organizational approval from local test success.
