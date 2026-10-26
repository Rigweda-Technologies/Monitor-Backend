# Desktop PostgreSQL and Prisma requirements

Source: `desktop/backend/src/database/schema.js` and module persistence code. This is a code-derived inventory; actual deployed schema/drift has not been inspected. Preserve the existing monitor database shared with HRMS.

## Existing table inventory

| Table | Role and mapping concerns |
|---|---|
| `monitor_screenshot_batches` | Text batch IDs, device/batch uniqueness, status/counts, BIGINT bytes and capture/completion times |
| `monitor_screenshots` | Text IDs, batch FK with SET NULL, device/client screenshot uniqueness, hashes, provider metadata and upload states |
| `monitor_cloudinary_settings` | Organization primary key; encrypted secret ciphertext, IV and authentication tag; server-only access |
| `monitor_activity_events` | IDs, unique daily key, activity date, event ID arrays, nonnegative counters and constrained status |
| `monitor_device_presence` | Device primary key, organization/employee scope, constrained status and last-seen timestamps |
| `monitor_app_usage_sessions` | Session primary key plus device/session uniqueness, JSONB keys, sensitive text and upload/retry fields |
| `monitor_browser_history` | Entry primary key plus device/entry uniqueness, URL/title, duration and observation time |
| `monitor_device_health` | BIGSERIAL ID, organization/device uniqueness, numeric/JSONB health values; endpoint ownership is separate |

Map physical names, nullability, defaults, primary/unique keys, relations, indexes, checks and native PostgreSQL types. Prisma field naming must not rename tables or columns. Preserve unsupported database features through explicitly owned SQL migrations where necessary. Do not assume introspection alone captures all operational semantics.

## Baseline and schema ownership

Inventory the full initialization file, including ALTERs, backfills and data consolidation, plus HRMS access/migration code. Compare with an isolated representative database before producing a Prisma baseline. Do not execute initialization just to discover schema; it can change existing data.

Establish one schema migration owner shared by HRMS and monitor deployments. V2 must not independently run startup DDL or replay an initial-create migration over populated tables. Do not reset or destructively synchronize existing databases. No schema change is authorized merely by selecting Prisma.

Separate database baseline verification from applying migrations to a shared environment. Record drift, migration history, backup/restore evidence, v1 compatibility and the proposed execution owner before any future deployment. Prisma setup commands and version pinning remain implementation work.

## Repository behavior

Use Prisma for all v2 PostgreSQL access. Inject a lifecycle-owned client into repository factories. Use transactions for all-or-nothing batch writes and screenshot completion; preserve concurrency guarantees and failure rollback. Parameterized Prisma raw SQL is acceptable for justified operations not adequately expressed by the ORM; document and test each exception.

Explicitly map BIGINT/decimal/date values into the public API without precision loss or serialization errors. Preserve timezone-derived activity dates and browser hash normalization. Keep duplicate IDs and existing constraints compatible across v1 and v2. Do not change keys simply to make an ORM upsert easier.

Some v1 conflict paths can overwrite ownership fields. V2 must reject another organization's/employee's identifiers instead of silently reassigning records. Treat necessary security differences as documented contract changes with regression tests, not as permission to modify v1 schema or behavior.

Shared physical data means separate servers are not full isolation: verify v2 writes can still be read safely by HRMS and v1. Budget total connections across services and versions. Never treat MongoDB and PostgreSQL/provider effects as one atomic transaction.

## Screenshot integrity

Resolve authenticated employee and validate organization/device/batch ownership at creation and completion. Verify provider assets using organization credentials before marking uploaded. Reject foreign identifiers and invalid duplicate references transactionally. Preserve encrypted settings compatibility; do not rotate encryption keys during ORM migration. Clients must receive public/signed data only.
