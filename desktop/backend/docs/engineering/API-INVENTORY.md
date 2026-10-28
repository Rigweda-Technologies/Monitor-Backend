# Desktop API inventory and v2 mapping

Observed registrations: `desktop/backend/src/routes.js`, the `src/modules/*/*.routes.js` files and `src/routes/agents.js`. All eight registered business route paths now have independent V2 Fastify implementations, OpenAPI schemas and unit/repository/HTTP coverage under `v2/monitor-api`. Real PostgreSQL integration has not run because no isolated database URL is configured. V1 source files remain unchanged.

See the repository [V1 module inventory](../../../../docs/engineering/V1-MODULE-INVENTORY.md) for the combined HRMS and desktop module checklist and supporting modules.

## Business endpoints

All business endpoints require authenticated HRMS sessions in v2. Preserve business payloads unless a documented versioned change is necessary. The target prefix is `/api/v2` in the independent monitor service.

| Method | Existing v1 path | Proposed v2 path | Behavior/reference module |
|---|---|---|---|
| POST | `/api/screenshots` | `/api/v2/screenshots` | Implemented: bounded multipart upload, tenant Cloudinary upload, content hash and compatible persistence |
| POST | `/api/screenshot-batches/uploads` | `/api/v2/screenshot-batches/uploads` | Implemented: owner-scoped batch/items, deduplication and signed provider upload parameters |
| POST | `/api/screenshot-batches/:batchId/complete` | `/api/v2/screenshot-batches/:batchId/complete` | Implemented: owner-scoped locking, server-side provider verification and transactional completion |
| POST | `/api/activity-events/batch` | `/api/v2/activity-events/batch` | Implemented: authenticated activity ingestion, daily aggregation and presence behavior |
| POST | `/api/app-usage/batch` | `/api/v2/app-usage/batch` | Implemented: application session ingestion with owner checks and bounded sensitive values |
| POST | `/api/browser-history/batch` | `/api/v2/browser-history/batch` | Implemented: normalized observations, deterministic deduplication and device ownership checks |
| GET | `/api/cloudinary/upload-config` | `/api/v2/cloudinary/upload-config` | Implemented: authenticated public organization settings allowlist |
| POST | `/api/agents/location` | `/api/v2/agents/location` | Implemented: validate and acknowledge without storing coordinates |

## Observed contract details to preserve or explicitly revise

- Screenshot uploads: direct upload accepts the V1 captured timestamp and file payload with a 25 MiB transport limit. Batch creation accepts 1-100 metadata records with SHA-256 and optional dimensions; it defers when tenant Cloudinary settings are absent. Completion requires the V1 upload claim fields but treats server-owned rows/provider verification as authoritative, and preserves exact acknowledgment identities. External upload and PostgreSQL cannot share one atomic transaction.
- Activity: `events` contains 1-100 entries. Required fields include `eventId`, `deviceId`, `observedAt`, and `status` (`active`, `idle`, `offline`). Active/idle seconds are integers from 0 to 3600. Preserve date/timezone aggregation semantics and duplicate safety.
- App usage: `events` contains 1-100 entries; identifiers, timestamps, app/process names and start/end times are required. Existing optional fields include key counts/names and typed text. Preserve compatibility without logging this sensitive content or expanding collection. Review conflicts before implementing upserts.
- Browser history: top-level `deviceId` and 1-200 `entries`; each entry needs timestamp, browser and URL. Existing response is 202 with inserted/duplicate counts. Entry identity hashes normalized input; timestamp normalization and duration clamping affect deduplication and need parity tests.
- Upload config: returns public settings; missing organization configuration returns 404. Inspect `publicUploadConfig` for the allowlisted fields and test that ciphertext and secrets never appear.
- Location: required `device_id`, timestamp, latitude [-90, 90], longitude [-180, 180], source (`windows_native`, `ip_fallback`, `failed`); optional metadata contains city/region strings or null. Current response is 200 with device ID, receipt time and source. Current code logs the report and does not persist location. Do not invent a location table or claim durable acceptance. V2 should minimize sensitive logging and must omit the diagnostic auth bypass described in architecture.

## Operational routes

V1 additionally registers `GET /`, `GET /api/health` and Swagger UI under `/docs`. V2 should expose its own root, `/api/v2/health` and documentation, plus a separately specified readiness endpoint. Swagger-generated resources and CORS handling are plugin behavior, not additional business capabilities. Freeze exact readiness/docs contracts during implementation.

## Boundaries and tracking

Desktop-to-HRMS profile/session lookups use the HRMS Express v1 namespace `/api/v1`. `HRMS_BACKEND_URL` may be configured as a host, `/api`, or `/api/v1` base; the desktop integration normalizes each form to `/api/v1`.

`monitor_device_health` exists in schema initialization, but no device-health business endpoint is registered in the inspected desktop router. Do not infer an endpoint from its table. Likewise, unused list/helper functions are not automatically public APIs. Inspect HRMS-owned APIs before assigning shared behavior to this service.

For each row record implementation file, request/response schemas, success/error statuses, permissions, persistence, provider effects, tests, versioned differences and client migration status. API coverage is complete only when all rows and their supporting behaviors are verified; this inventory alone is not that evidence.
