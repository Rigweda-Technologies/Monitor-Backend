# Desktop backend v2 guidance

Status: all registered desktop monitor business route paths are implemented in `v2/monitor-api` with OpenAPI schemas and unit/repository/HTTP coverage. Isolated PostgreSQL integration is not verified unless the dedicated test URL is configured. Source inspection and implementation update: 27 October 2026. These files specialize the [v2 specification](../../../../docs/engineering/V2-API-SPEC.md) and [all 22 engineering standards](../../../../docs/engineering/STANDARDS.md) for monitor ingestion. They do not replace the shared standards.

## Scope

Build the new desktop/monitor API in `v2/monitor-api` using Node.js, JavaScript ESM, Fastify and Prisma for the existing monitor PostgreSQL database. Keep `desktop/backend` and HRMS v1 unchanged. No MongoDB client is required in this service merely because HRMS uses MongoDB; resolve employee/session information through the HRMS integration.

Preserve screenshot ingestion, signed batch uploads/completion, activity, app usage, browser history, public upload configuration and location reporting. HRMS owns administrative/read APIs; a shared table does not imply a new desktop read endpoint.

## Documents

1. [Architecture](ARCHITECTURE.md): boundaries, authentication, lifecycle and configuration.
2. [API inventory](API-INVENTORY.md): observed v1 registrations and proposed v2 mappings.
3. [Database and Prisma](DATABASE-PRISMA.md): existing tables, data compatibility and ownership.
4. [Testing and migration](TESTING-MIGRATION.md): parity, failure scenarios and completion evidence.

## Generation instructions

Read the root [AGENTS.md](../../../../AGENTS.md), these documents and the relevant source files before generating code. Use function-first routes/controllers/services/repositories and inject external dependencies. Implement independently under `v2/monitor-api`; do not modify or import v1 application startup. Do not connect to production to generate fixtures or baseline a schema.

Use the [feature specification](../../../../docs/engineering/templates/FEATURE-SPEC.md) for future module work and [review/release template](../../../../docs/engineering/templates/REVIEW-AND-RELEASE.md) for evidence. Do not treat route implementation as database integration, deployment, client migration or production verification.

All shared standards apply where relevant: coding/layering, review, tests, contracts, databases, security, CI/CD, environments, infrastructure, observability, performance and recovery. Flutter implementation/testing (sections 3 and 8) is outside this service; client compatibility handoff still applies. Section 9 applies to software-side monitor-agent ingestion. Do not invent cloud choices, coverage targets or production approvers.
