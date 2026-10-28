# Monitor API V2

Independent Node.js/Fastify service for the V2 monitor API. It implements all eight registered desktop business route paths: activity, app usage, browser history, Cloudinary upload config, location, direct screenshots, screenshot batch creation and screenshot batch completion. Routes have OpenAPI schemas and appear in Swagger at `/docs`. Unit/repository/HTTP checks cover their contracts. Real PostgreSQL integration remains unverified unless `V2_MONITOR_ISOLATED_TEST_DATABASE_URL` is configured for a dedicated isolated database. No client cutover or deployment is implied.

Every route in this service, including root, health and readiness, must have a Fastify OpenAPI schema and appear in the Swagger UI at `/docs`. Extend the OpenAPI route-coverage test whenever adding an API.

Regenerate the HRMS combined Swagger fallback snapshot after changing route schemas:

```sh
npm run openapi:export
```

The generator builds the Fastify app with injected no-op dependencies and writes the route document to `hrms/back-end/src/openapi/monitor-v2.json`; it does not connect to PostgreSQL or start the server.

V1 stays in `desktop/backend` and HRMS v1 stays in `hrms/back-end`. This service does not import or start either V1 application.

## Runtime configuration

Set these values explicitly in the process environment or in this service's own `.env` file:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Existing monitor PostgreSQL database connection. Use a dedicated isolated database for tests. |
| `HRMS_BACKEND_URL` | HRMS origin or `/api` or `/api/v1` base used for active-session verification. |
| `PORT` | V2 monitor API port; defaults to `3002`. |
| `PUBLIC_API_URL` | Optional externally reachable API base used in OpenAPI server metadata; defaults to `http://localhost:<PORT>`. |
| `HOST` | Listen address; defaults to `0.0.0.0`. |
| `CORS_ORIGINS` | Comma-separated exact browser origins; empty means no browser origins. |
| `DATABASE_POOL_MAX` | Maximum PostgreSQL pool size; defaults to `5`. |
| `DATABASE_SSL` | Set `true` to require TLS. |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | TLS certificate validation; defaults to `true`. |
| `HRMS_REQUEST_TIMEOUT_MS` | HRMS profile verification timeout; defaults to `10000`. |
| `MONITOR_SETTINGS_SECRET` | Key compatible with existing encrypted tenant Cloudinary settings. If omitted, configured `JWT_SECRET` is used only as the legacy-compatible encryption key. |

Do not load V1 `.env` files or copy their secrets. Do not run Prisma migrations or schema synchronization for this module. The existing monitor schema has V1 startup DDL/backfills; migration ownership and baseline reconciliation remain separate work. Direct multipart screenshots retain V1’s 25 MiB file limit and accept its file MIME behavior. Screenshot completion verifies provider assets before committing metadata. Cloudinary and PostgreSQL cannot share one atomic transaction, so an uploaded asset can be orphaned if a later database write fails.

## Commands

Run from `v2/monitor-api`:

```sh
npm ci
npm run prisma:generate
npm test
npm start
```

The Prisma CLI is pinned to stable Prisma 7. The package uses Prisma's JavaScript client generator to keep the handwritten service JavaScript-only; that generator is in maintenance mode and should be revisited before broad V2 rollout.
