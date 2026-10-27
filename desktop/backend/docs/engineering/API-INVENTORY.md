# Desktop API inventory and v2 mapping

Observed registrations: `desktop/backend/src/routes.js`, the five `src/modules/*/*.routes.js` files and `src/routes/agents.js`. All rows are **inventoried only**, not implemented or verified in v2. Full field-level contracts must be extracted from controllers, validators, services and tests before each module is generated.

See the repository [V1 module inventory](../../../../docs/engineering/V1-MODULE-INVENTORY.md) for the combined HRMS and desktop module checklist and supporting modules.

## Business endpoints

All business endpoints require authenticated HRMS sessions in v2. Preserve business payloads unless a documented versioned change is necessary. The target prefix is `/api/v2` in the independent monitor service.

| Method | Existing v1 path | Proposed v2 path | Behavior/reference module |
|---|---|---|---|
| POST | `/api/screenshots` | `/api/v2/screenshots` | Multipart screenshot; screenshots controller/service/validation |
| POST | `/api/screenshot-batches/uploads` | `/api/v2/screenshot-batches/uploads` | Durable batch metadata and signed provider upload parameters |
| POST | `/api/screenshot-batches/:batchId/complete` | `/api/v2/screenshot-batches/:batchId/complete` | Ownership/provider verification and transactional completion |
| POST | `/api/activity-events/batch` | `/api/v2/activity-events/batch` | Authenticated activity events and presence behavior |
| POST | `/api/app-usage/batch` | `/api/v2/app-usage/batch` | Application session ingestion |
| POST | `/api/browser-history/batch` | `/api/v2/browser-history/batch` | Browser observations and duplicate handling |
| GET | `/api/cloudinary/upload-config` | `/api/v2/cloudinary/upload-config` | Public organization upload settings only |
| POST | `/api/agents/location` | `/api/v2/agents/location` | Validate and acknowledge location report |

## Observed contract details to preserve or explicitly revise

- Screenshot uploads: captured timestamp and multipart file handling; signed batch creation and completion require deeper field/status extraction from their existing validators/controllers. Preserve exact completion acknowledgment identities so agents do not prematurely delete local files.
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
