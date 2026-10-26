# Monitor Backend

Owns both API services, preserving their existing architecture:

- `hrms/back-end`: Express HRMS API, MongoDB, monitor read APIs, payroll integration.
- `desktop/backend`: Fastify monitor ingestion API and PostgreSQL schema.
- `postman`, `.postman`: existing API collections/configuration.
- `dump-rigweda-202609161810.sql`: original database export, copied locally and Git-ignored.

## Install and run

Requires Node.js 22.11+ with npm, MongoDB and PostgreSQL.

```sh
npm run setup
npm run local
```

Starts HRMS at `http://localhost:8000` and monitor ingestion at `http://localhost:3001`. Run `npm run hrms:local` or `npm run desktop:local` to start only one. Ctrl+C stops the child processes. A failed child stops the suite and produces a nonzero exit code. `npm test` runs both backend suites.

Configure environments using [ENVIRONMENTS.md](ENVIRONMENTS.md). Both services must target the same monitor database, and `HRMS_BACKEND_URL` in the monitor service must target the HRMS API for active-session verification. The monitor service remains in the same repository as HRMS; existing cross-service tests and environment fallback paths remain valid.

Start `npm run local` separately in Monitor-Frontend and Monitor-Agent to connect the suite. No sibling checkout is needed to start these APIs.

Deploy HRMS with root `hrms/back-end`, and monitor ingestion with root `desktop/backend`. Keep both deployment services; this migration does not merge their HTTP APIs.

See [ENVIRONMENTS.md](ENVIRONMENTS.md), [migration inventory](docs/MIGRATION.md), and [verification](docs/VERIFICATION.md). Existing app READMEs and historical monorepo docs are preserved.

## Engineering standards and code generation

Start with [engineering guidance](docs/engineering/README.md) for the handbook-derived standards, repository constraints, open decisions and reusable feature/release templates. Coding agents should read [AGENTS.md](AGENTS.md). These documents describe the proposed baseline; they do not imply CI or deployment controls are already implemented.

## V2 API direction

A separate Node.js/Fastify v2 with Prisma for PostgreSQL is specified in [V2-API-SPEC.md](docs/engineering/V2-API-SPEC.md). It retains existing databases and leaves v1 untouched. V2 code and startup commands are not implemented yet; the commands above continue to run v1.
