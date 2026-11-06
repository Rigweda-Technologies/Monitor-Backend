# Desktop backend v2 architecture

Current reference: `desktop/backend/src/server.js`, `routes.js`, `middleware/auth.js`, `config/env.js` and `integrations/`. This is a source-level review, not live runtime verification.

## Target boundaries

- `src/app.js`: construct a Fastify instance with injected configuration, repositories and provider clients; no implicit listen or schema mutation.
- `src/server.js`: validate configuration, initialize owned resources, listen and shut down gracefully.
- `src/plugins/`: authentication, safe centralized errors, request correlation, CORS, multipart and OpenAPI setup.
- `src/modules/<module>/`: route/schema/controller/service functions for each inventory capability.
- `src/repositories/`: all PostgreSQL access through Prisma, including transaction orchestration at the business-operation boundary.
- `src/integrations/`: HRMS session/profile verification and Cloudinary provider calls with bounded timeouts and explicit failure behavior.
- `tests/`: isolated contract, unit and database integration tests.

The app, server, plugins, all registered desktop business route modules, device-ownership helper, Prisma mappings, provider adapters and tests exist under `v2/monitor-api`. Keep dependencies and generated Prisma clients deployable independently. Do not expose a database client to route handlers or create a client per request. Preserve ESM conventions; classes need a documented benefit.

## Authentication and ownership

V1 calls HRMS `/users/me/profile` to enforce active sessions and disabled-account/password-change restrictions. JWT decoding alone is not authentication. V2 MUST retain authoritative verification before trusting identity claims and fail closed when HRMS is unavailable. Distinguish invalid credentials from a dependency outage in the documented contract.

Resolve organization and employee from verified identity/profile, never solely from payload IDs. Enforce organization, employee, device, batch and screenshot ownership on writes and conflicts. Test cross-owner collisions even where v1 SQL currently updates on conflict. Preserve session revocation on batch completion. Initially integrate with the existing HRMS API; v2 must not require HRMS v2 to be deployed first.

The v1 location route contains a non-production diagnostic-token bypass. V2 MUST use injected test authentication in isolated tests rather than copying a runtime authentication bypass. Record this deliberate security difference in its contract tests. Do not change v1 to achieve it.

## Configuration contract

Read variable names from v1 configuration and integration code, never real secret files. V2 must use its own validated configuration and explicit targets, without loading v1 `.env` files through fallback paths.

| Setting | Requirement for v2 |
|---|---|
| Monitor database URL | Explicit target for the existing monitor store; isolated database for tests |
| HRMS base URL | Explicit session/profile verification endpoint; preserve current HRMS compatibility |
| Monitor settings encryption key | Compatible with existing encrypted organization credentials; never regenerate implicitly |
| Host and port | Independent process with a non-conflicting port, documented when selected |
| CORS origins | Explicit allowlist and tested credentials behavior |
| Database TLS/pool/timeouts | Validate settings and account for aggregate v1/v2 resource use |
| Provider/request timeouts | Bounded and tested; no indefinite waits |

Do not silently inherit hosted defaults for tests. Inspect whether legacy JWT secret/configuration requirements are actually needed by the selected v2 verifier before defining the final environment template. Do not copy unused secrets.

## Uploads and lifecycle

Preserve agent direct-to-Cloudinary uploads, server-side encrypted credentials, signed parameters and provider verification before completion. Never return API secrets or raw credential material. Missing organization configuration must not fall back to another organization's/global credentials.

Existing multipart configuration limits individual files to 25 MiB; preserve or explicitly document/test any v2 limit change. Bound request bodies and batch sizes as well. Safe errors must not reproduce arbitrary internal exception messages. Redact location, browsing URLs, typed text, screenshots and tokens from routine logs.

Provide separate liveness and readiness semantics. Readiness must assess ability to accept required work without leaking details. OpenAPI must advertise the v2 endpoint, not the v1 server by accident. Close owned database/network resources on shutdown. Do not run schema creation/backfills on HTTP startup.
