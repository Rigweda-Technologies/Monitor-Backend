# HRMS backend v2 guidance

Status: documentation only; v2 implementation not started. Source inspection: 26 October 2026.

Build a separate Node.js/Fastify HRMS API under `v2/hrms-api`. Retain existing MongoDB collections through Mongoose and use Prisma for all v2 PostgreSQL persistence. Leave v1 application code, routes, dependencies, configuration and startup unchanged. The user controls client migration.

These documents are stored with the service for discoverability; this does not move the proposed v2 implementation into the v1 application.

## Read order

1. [Architecture](ARCHITECTURE.md)
2. [API inventory](API-INVENTORY.md)
3. [Database and Prisma](DATABASE-PRISMA.md)
4. [Testing and migration](TESTING-MIGRATION.md)

Also read the root [AGENTS.md](../../../../AGENTS.md), [v2 specification](../../../../docs/engineering/V2-API-SPEC.md), [22 standards](../../../../docs/engineering/STANDARDS.md) and [decision register](../../../../docs/engineering/DECISIONS.md). The shared standards remain canonical; do not fork their rules into inconsistent service copies.

The existing HRMS [payroll documentation](../payroll/README.md) and [organization documents API](../organization-documents-api.md) provide domain context; recheck implementation before assuming historical descriptions match current behavior.

All applicable backend standards cover this service. Flutter implementation and selectors are client responsibilities; client contract compatibility remains part of HRMS handoff. Device-ingestion requirements apply to agent APIs. No framework migration, database migration, deployment or client cutover has been performed by creating these files.

## Current v1 CI/CD work

The user authorized CI/CD for the existing v1 HRMS API before migrating to v2. Read [the development specification](CICD-AWS.md) and [AWS deployment runbook](../../../../deploy/hrms/README.md). This is a scoped exception to v1 preservation; no v2 migration is included.
