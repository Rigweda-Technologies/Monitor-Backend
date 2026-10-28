# Engineering guidance for Monitor-Backend

Use these documents as context for future code generation. They summarize and adapt **Rigweda Engineering Standards, Testing & CI/CD Handbook**, version 1.0, 8 October 2026, 67 pages, document owner: Tech Lead. Source supplied by the user: `Rigweda_Engineering_Standards_CICD.pdf`.

**Status:** repository guidance derived from a proposed baseline for internal finalization. Creating these files does not implement CI, prove compliance, or finalize policy choices. PDF page references use printed page numbers. Illustrative incidents and snippets are examples, not evidence about this project.

## Selected v2 architecture

The user selected a separate **Node.js + Fastify v2 API**, with **Prisma for PostgreSQL** and existing MongoDB persistence retained. HRMS Express APIs now use `/api/v1`; desktop Fastify v1 route paths remain unchanged. Client migration to v2 is user-controlled. Read [the v2 specification](V2-API-SPEC.md) before generating v2 code. This decision supersedes the earlier instruction to preserve the framework stack for all future code; framework preservation applies to v1. All eight registered desktop business route paths are implemented under `v2/monitor-api` with OpenAPI schemas and unit/repository/HTTP coverage. Optional isolated-PostgreSQL tests skip unless explicitly configured. No database migration, client cutover or deployment has run.

## Read order

1. [Repository context](REPOSITORY-CONTEXT.md): services, paths, existing commands and constraints.
2. [V1 module inventory](V1-MODULE-INVENTORY.md): registered business APIs and supporting V1 modules to migrate.
3. [Standards](STANDARDS.md): all 22 handbook sections, their applicability and gates.
4. [Decision register](DECISIONS.md): current conventions versus unresolved organizational choices.
5. [Feature specification](templates/FEATURE-SPEC.md): fill in the behavior before generating a feature.
6. [Review and release evidence](templates/REVIEW-AND-RELEASE.md): record validation and distinct completion gates.

The root [AGENTS.md](../../AGENTS.md) is the entry point for coding agents. HRMS Express v1 routes use `/api/v1`; desktop Fastify v1 route paths remain as registered. Existing [setup](../../README.md), [environments](../../ENVIRONMENTS.md), and service documentation remain relevant. Historical verification reports describe their recorded runs, not current test results.

## Example code-generation request

> Implement the completed feature specification at `<spec-path>` in Monitor-Backend. Follow AGENTS.md and docs/engineering/STANDARDS.md. For v2 work, follow V2-API-SPEC.md and keep v1 behavior stable; use REPOSITORY-CONTEXT.md to understand current behavior. Consult DECISIONS.md; do not silently choose unresolved policies. Implement the specified behavior, meaningful tests and applicable documentation. Run the relevant available checks and report exact results, skips and remaining gaps. Keep deployment a separate task unless requested.

Replace `<spec-path>` with a completed specification; this is a prompt template, not an executable command.

## Requirement language

- **MUST** identifies a mandatory rule within this proposed baseline or a stated repository implementation constraint; it does not assert organizational approval.
- **SHOULD** identifies a recommendation that may need a documented reason to depart.
- **Conditional** rules apply only to the relevant technology or change.
- **Pending** decisions require a recorded choice before the dependent control can be implemented or claimed as satisfied.
- **Not applicable here** means outside this backend repository, not omitted from the source.

When guidance and existing implementation differ, identify the gap and scope a compatible change. Do not automatically rewrite working code. Record source-version updates and approved policy decisions in these documents when they occur.

## Service-specific guidance

- [Desktop backend v2](../../desktop/backend/docs/engineering/README.md): architecture, endpoint inventory, Prisma mapping requirements, testing and migration.

- [HRMS backend v2](../../hrms/back-end/docs/engineering/README.md): architecture, mount inventory, persistence requirements, testing and migration.
