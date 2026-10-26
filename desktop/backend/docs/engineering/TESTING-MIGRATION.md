# Desktop v2 testing and migration evidence

All scenarios below are required where relevant to changed behavior. No v2 tests have run and no implementation completion is claimed.

## Existing evidence sources

Read these v1 tests for behavior; do not modify them for v2:

- `desktop/backend/tests/cloudinarySecrets.test.js`
- `desktop/backend/tests/location.test.js`
- `desktop/backend/tests/sessionRevocation.test.js`
- HRMS screenshot ownership, session ownership, asset verification and signed-delivery tests under `hrms/back-end/tests/`.

The existing desktop command is `npm test --prefix desktop/backend`; it tests v1, not v2. Database ownership tests may need `MONITOR_OWNERSHIP_TEST_URL` pointing to an isolated database. Inspect fixtures and cleanup before executing. Skipped tests are not passing integration evidence. Document v2 commands only after creating and verifying them.

## Verification matrix

| Area | Required scenarios |
|---|---|
| Authentication | Missing/malformed/revoked sessions, disabled/password-change restrictions, HRMS failure/timeout, organization identity and no runtime diagnostic bypass |
| Screenshots | Multipart validation/limits, signed-session creation, repeat requests, foreign device/batch/employee, provider mismatch/unavailability, transaction rollback and exact completion acknowledgment |
| Credentials | Organization isolation, missing settings, public-field allowlist, no secret/ciphertext leakage, existing encryption compatibility |
| Activity | Boundary batch sizes, status/duration validation, replay, concurrent ingestion, timezone/date boundaries, delayed/out-of-order events and presence correctness |
| App usage | Batch atomicity, duplicate/session conflicts, cross-owner rejection, optional key/text bounds and safe logging |
| Browser history | Batch bounds, timestamp normalization, deterministic hashes, duplicate counts, duration handling and cross-owner collision behavior |
| Location | Coordinate/source/metadata validation, authenticated acknowledgment, no invented persistence, sensitive-log minimization |
| Prisma | Real PostgreSQL constraints/transactions, type serialization, schema mappings, concurrent conflicts, no request-time client creation or startup DDL |
| Operations | Independent boot, configuration failure, readiness, graceful shutdown, no port conflict, bounded pools/timeouts and v2 OpenAPI |
| Compatibility | All endpoint mappings, response/status/error semantics, v1 unchanged, HRMS read compatibility and documented intentional differences |

Use Node's test runner, dependency-injected unit tests and Fastify application injection for HTTP contracts. Use real isolated PostgreSQL for ORM integration and controlled HRMS/Cloudinary substitutes for failures. Compare equivalent synthetic fixtures in separate v1/v2 test databases; avoid double-sending production effects. Define allowed timestamp/generated-ID tolerances explicitly.

## Delivery sequence

1. Finish field-level endpoint contracts and inventory database dependencies.
2. Build the independent service lifecycle/configuration and verify authentication first.
3. Validate Prisma mappings and baseline strategy on an isolated database copy.
4. Implement each inventory module with unit, contract, ownership and integration evidence.
5. Verify cross-service reads, replay/concurrency, resource limits and safe recovery.
6. Package independent deployment instructions, exact tested commands, configuration examples without credentials and migration status per endpoint.
7. Let the user choose client cutover; do not redirect agent URLs or disable v1.

## Release and recovery

Record reviewed commit, artifact identity, endpoint coverage, test results/skips, schema compatibility, configuration, approver, health window and recovery owner. Define thresholds from agreed requirements; do not invent throughput/latency targets from handbook examples.

Monitor error rates, request latency, authentication dependency failures, ingestion delay, provider failures, pool saturation and duplicate/retry behavior with bounded metric labels. Avoid personal data and request/device IDs as high-cardinality labels. Separate accepted-work durability from process liveness.

V1 remains the fallback, but routing back does not undo v2 database writes or uploads. Ensure readable compatible records, no duplicated background work, durable retry semantics and provider-effect reconciliation. A successful local run is not production verification. Use the [shared evidence template](../../../../docs/engineering/templates/REVIEW-AND-RELEASE.md).
