# HRMS API v2

Independent JavaScript/Fastify service. All 250 unique operations in the mounted HRMS V1 route graph are registered under `/api/v2` and described by generated OpenAPI; the source graph has 251 registrations because one operation is registered twice. The automated `tests/v1-route-completeness.test.js` check compares each unique method/path with both runtime registrations and Swagger paths. V1 startup, source, dependencies and client routing are unchanged.

The full test suite passed **313 tests, 0 failures, 0 skips** with isolated local MongoDB and PostgreSQL test URLs. Prisma monitor/payroll schemas validate and clients generate; the disposable payroll test database verified parameterized SQL, transaction commit/rollback, and tenant-scoped cleanup against the existing V1 migration schema. Direct V1/V2 comparisons cover auth, CRUD, supporting workflows, providers and broad route groups. They do not compare every success/error path for all 250 operations. Live queue, socket, Firebase, Cloudinary, email and R2 delivery were not exercised. Clients remain on V1.

## Run

Requires Node.js 22.12+ (22.x) or 24.x and MongoDB. From this directory:

```sh
npm ci
npm test
npm start
```

Set `MONGODB_URI` and `JWT_SECRET` in the process environment or this directory's own `.env`. Use `.env.example` for variable names only. During coexistence, securely provision the existing signing configuration and target MongoDB explicitly. Startup never reads v1 environment files, seeds users, creates collections/indexes or starts jobs. Default binding is `127.0.0.1:8002`.

For local startup, confirm MongoDB is running and reachable at the database in `MONGODB_URI`, then ensure `JWT_SECRET` is set in `v2/hrms-api/.env`. PostgreSQL is optional unless `PAYROLL_DB_ENABLED=true` (or PostgreSQL configuration implicitly enables payroll); when enabled, its configured database must also be reachable. Startup reports allowlisted configuration errors and safe dependency categories without printing database URLs or credentials.

To explicitly create the initial SYSTEM superadmin, set `HRMS_BOOTSTRAP_EMAIL` and `HRMS_BOOTSTRAP_PASSWORD` securely in this service's ignored `.env` and run `npm run bootstrap:system`. The password must be at least 12 characters. The command uses the configured MongoDB database and existing V1-compatible indexes, never runs during server startup, and refuses to attach an existing unrelated account. It does not print credentials or change an existing account's password.

For existing non-SYSTEM organizations, `npm run seed:organization-roles` connects and reports the matching organization count without writes. Review the target, then use `npm run seed:organization-roles -- --apply` to seed all non-SYSTEM organizations, or add `--organization=<24-hex-id>` to target one organization. It never runs during API startup and does not create MongoDB collections or indexes.

For payroll tenant synchronization, `npm run seed:payroll-tenants` lists organizations without writing. Add `-- --organization=<24-hex-id>` to inspect one organization. To apply, set `PAYROLL_DB_ENABLED=true`, configure its PostgreSQL URL, then run `npm run seed:payroll-tenants -- --apply` (optionally with the organization filter). The command uses Prisma and commits each organization upsert separately, so it reports how many rows completed if a later upsert fails. It never runs during API startup.

For a hard-delete impact report, run `npm run org:hard-delete -- --dry-run --org=<organization-id>`. Execution requires `npm run org:hard-delete -- --org=<organization-id> --actor=<superadmin-user-id> --confirm=<ORG_CODE> --yes`; it uses the V2 lifecycle service and writes a JSON before-state report under the ignored `reports/org-hard-delete/` directory. The service enforces superadmin membership and confirmation code.

Swagger UI: `/docs`; generated OpenAPI: `/docs/json`. Liveness: `/api/v2/health`; readiness: `/api/v2/ready` checks MongoDB and the opt-in payroll database. It does not check the optional monitor database or external providers.

## Contract mapping

Change only `/api/v1/users` to `/api/v2/users` for these routes when a separately authorized client cutover is ready:

| Method | Suffix | Input | Result |
|---|---|---|---|
| POST | `/login` | email, password | Login data; JWT in Authorization response header |
| POST | `/login/selfie` | email, password, selfieImage, livenessSelfieImage | Login data plus existing selfie fields; JWT header |
| POST | `/switch-org` | organizationId | organizationId, activeRoleId, roles; JWT header |
| GET | `/me/profile` | Bearer session | Existing selected profile fields |
| GET | `/me/permissions` | Bearer session | Permission code array |
| POST | `/send-otp` | email | Null data, OTP sent message |
| POST | `/verify-otp` | email, otp | Null data, OTP verified message |
| POST | `/forgot-password/send-otp` | email | Null data, OTP sent message |
| POST | `/forgot-password/verify-otp` | email, otp | Null data, OTP verified message |
| POST | `/forgot-password/reset-password` | email, password, confirmPassword | Null data, password updated message |
| POST | `/change-password/send-otp` | Bearer session | Null data, OTP sent message |
| POST | `/change-password/verify-otp` | Bearer session and otp | Null data, OTP verified message |
| POST | `/change-password/update` | Bearer session, password, confirmPassword | Null data, password updated message |

Authenticated password routes derive email from the verified user. JSON and form-encoded requests are supported. Joi validators preserve v1 normalization, unknown-field rejection, first error and HTTP 406 `{code,message,data,error:[]}`. Successful and business-error responses preserve `{success,code,message,data,error}`. JWTs stay out of response bodies; configured browser origins can read the Authorization header.

## Structure and persistence

`app.js` constructs HTTP handling, `runtime.js` composes dependencies, and `server.js` owns listening/shutdown. `modules/auth` separates routes, controllers, schemas, validation, business services and Mongoose repository. Integrations own JWT, bcrypt, email and biometric-provider calls. No runtime import from v1.

Physical collections: `users`, `org_users`, `organizations`, `roles`, `permissions`, `employees`, `org_settings`. User/membership/role/organization/permission definitions retain the v1 schema shapes; employee/settings models are read-only auth projections. Automatic collection/index creation is disabled. Existing v1 indexes, particularly the unique user/organization membership index, remain deployment prerequisites; this service does not install them.

No PostgreSQL operation is needed by auth. Future HRMS PostgreSQL modules must use Prisma; no unused PostgreSQL connection or schema migration is introduced here.

V2 session writes use bounded compare-and-set retries; OTP attempts increment conditionally, and OTP/reset grants are consumed conditionally. Those changes preserve stored field names and avoid races between v2 writers. They cannot repair simultaneous v1 read/modify/write races. JWT `jti` makes same-second sessions distinct without changing the response shape or claims v1 uses.

## Tests

```sh
# Explicit isolated database only; never a production URL.
V2_HRMS_ISOLATED_TEST_DATABASE_URL=mongodb://127.0.0.1:27862/hrms_v2_test npm test
```

Without that variable, real MongoDB and server tests skip and are not integration evidence. Tests reject database names without a test/isolated/ci component, use synthetic IDs, and clean only their own fixtures. The parity harness uses a second database with `_legacy` appended to the supplied database name. It loads v1 route/controller/service code only inside tests, with providers stubbed and no v1 application startup, bootstrap, environment loading or logging. Install v1 dependencies separately to run these reference comparisons; the standalone runtime does not require them.

The parity suite compares status, JSON and token-header presence for all 13 flows against real v1 code. Validation parity also exercises malformed input. Other tests cover permissions, session revocation, concurrent login caps, concurrent OTP attempts and grant consumption, external failures, OpenAPI coverage, actual server readiness and SIGTERM shutdown. Email and face-provider tests are synthetic; no live delivery or biometric verification is claimed.

## Compatibility boundaries before client cutover

The normal auth request payloads, validation, status codes and response bodies are preserved and directly compared against v1 code using separate isolated databases, including records missing later schema defaults. This is not proof that every legacy edge case is interchangeable:

- V2 checks current membership and tenant-scoped active roles. V1's token-only `superadmin`/`bypassMonitorDb` shortcut and system-organization-only privilege shortcut are not accepted. Privileged switching requires a persisted superadmin role. Special administrative callers need explicit compatibility/security review before migration.
- Internal database errors and arbitrary face-provider error details are not reflected to callers. Known business errors retain their contracts; unsafe diagnostic details are suppressed. Provider outage messages and opt-in fallback remain supported.
- Existing reset authorization remains a user-wide ten-minute verification window, and password changes retain existing sessions. Strengthening that policy would require a separate coordinated contract decision. Delivery failures retain v1's successful send-OTP response; it is not proof of email delivery.
- Rate limits retain the existing 15-minute defaults (public 10000, global auth 3000), with bounded in-process storage. Distributed Redis enforcement is not implemented; do not treat multiple replicas as sharing counters.
- MongoDB schema/index ownership remains with v1. Atomic v2 updates alone do not establish safe concurrent v1/v2 writes.

Do not move monitor v2 or other clients automatically. Returning routing to v1 does not undo changed passwords, consumed OTPs, rotated tokens, membership changes or sent email. No V2 or production database migration, deployment or client cutover is included. Existing V1 payroll migrations were applied only to a disposable local test database.

## Dependency notes

Versions are independently locked. Joi is patched within v1's major version and tested against the original validators. A `glob` override patches Swagger UI's transitive static-file dependency; Swagger assets are tested. No changes to v1 dependencies are needed.

Validation evidence is recorded in `VERIFICATION.md`. Development delivery and recovery are documented in [`../../deploy/hrms-v2/README.md`](../../deploy/hrms-v2/README.md).
