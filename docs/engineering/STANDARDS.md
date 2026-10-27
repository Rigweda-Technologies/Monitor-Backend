# Engineering standards

Source: Rigweda Engineering Standards, Testing & CI/CD Handbook v1.0, 8 October 2026. This is a practical summary of all 22 sections, adapted to Monitor-Backend, not a verbatim replacement for the handbook. Source status remains **proposed baseline for internal finalization**. Rule language is defined in [the index](README.md); unresolved choices are in [the decision register](DECISIONS.md).

## Repository-specific v2 decision

User direction dated 26 October 2026: create a separate Node.js/Fastify v2 using Prisma for PostgreSQL and the existing databases, without touching v1. This is a repository requirement in addition to the proposed handbook baseline. Follow [the v2 specification](V2-API-SPEC.md). Current v1 Express/Fastify and direct PostgreSQL access are historical implementation context, not the target for new v2 code.

User direction dated 27 October 2026: namespace all HRMS Express business API routes under `/api/v1`; desktop Fastify v1 route paths remain unchanged. Update integrations that call HRMS. This explicit URL-prefix change takes precedence over the general existing-route compatibility guidance below. Coordinate deployed clients before releasing the HRMS prefix change.

## 1. General coding standards

Source: pp. 3-5. Applies to all code changes.

- MUST use meaningful names, explicit units and functions with one clear responsibility. Remove unused code and commented-out implementations.
- MUST validate external input, keep configuration outside business logic and never hardcode credentials. Explain non-obvious business decisions.
- SHOULD reuse owned shared behavior where it reduces duplication without unnecessary abstraction. Shared authentication, networking, errors and configuration need clear ownership.
- MUST keep changes focused, follow repository conventions and test important business rules. Review dependency additions for compatibility, maintenance, licensing and security.

Developers implement; reviewers assess behavior and clarity. Applicable formatting, lint and tests are automated controls to establish. Unresolved correctness or security issues block merge.

## 2. Node.js / TypeScript standards

Source: pp. 6-8. Applies to both APIs; TypeScript rules are conditional on TypeScript adoption.

- MUST use functions by default for routes, controllers, services, repositories, utilities and hooks. Classes require a clear benefit such as lifecycle management or dependency coordination; avoid boilerplate and inheritance hierarchies.
- MUST keep controllers responsible for HTTP I/O, services for business rules and repositories/models for database access. Transactions follow the business operation. Inject dependencies through parameters or factories.
- For TypeScript, MUST use the agreed strict configuration, explicit domain types, validated `unknown` for untrusted values and justified uses of `any`. Do not silently migrate existing JavaScript.
- MUST handle asynchronous failures and set external-call timeouts. Retry only suitable transient failures with bounded attempts/backoff and safe duplicate behavior.
- Workers MUST define idempotency, ordering, retry limits, dead-letter recovery and graceful resource shutdown.
- SHOULD enforce layer imports mechanically where practical. Define request/response contracts, map persisted rows at the persistence boundary and test pure formulas independently. Select tests by impact, not by the number of layers touched.

For v2, MUST implement HTTP handling as Fastify routes/plugins/hooks with function-first services and injected repositories. PostgreSQL repositories MUST use Prisma; MongoDB repositories retain Mongoose. Do not import v1 application entrypoints or depend on modifying v1 middleware.

Backend developers own implementation and unit/integration evidence. Required type-check/test failures and unhandled critical paths block merge.

## 3. Flutter coding standards

Source: pp. 9-13. Not applicable to implementation in this backend-only repository; retain for coordinated client handoff.

Client teams MUST follow their agreed architecture, separate data/business/presentation concerns and implement loading, success, empty, validation, error, timeout, unauthorized and relevant offline states. Provide safe retry behavior, accessibility, responsive layouts, resource disposal and safe async updates.

Developers MUST provide stable identifiers for critical controls and result states before QA handoff. Flutter `ValueKey` supports Flutter tests; it does not automatically become a native automation identifier. Verify `Semantics.identifier` support and discoverability with actual Android/iOS drivers. Verify Flutter web accessibility semantics before relying on role/name locators. IDs must be unique in scope, stable and non-sensitive; accessible labels must remain natural user-facing text. Avoid coordinates, positions, timestamps and random IDs. Document a selector inventory and avoid duplicate semantics for the same action.

Client developers own unit/widget tests and testability; QA supports critical journeys. Missing critical discoverability blocks handoff unless an explicit equivalent strategy is agreed. Framework examples do not mandate Riverpod, Dio or Freezed.

## 4. Git and branching standards

Source: pp. 14-16.

MUST use short-lived, descriptive feature/bugfix/hotfix branches and traceable commits. Follow the agreed merge/rebase policy and delete completed branches. Protect main with PRs, independent approval, required checks and resolved conversations; prevent normal direct/force pushes. Configure CODEOWNERS with enforced ownership review and dismiss stale approvals after material changes.

Hotfixes SHOULD start from the deployed commit/tag, contain a minimal fix and regression test, pass expedited independent review/CI, and be brought back into active development branches. Emergencies require a documented authorized exception and follow-up review, not an automatic bypass.

Developers own branches; Tech Lead/admins own protection. Missing required review/checks blocks merge. Final branching/environment mapping remains pending.

## 5. Pull requests and code review

Source: pp. 17-19.

PRs MUST explain purpose, behavior, tests, API/database/ingestion impact, security, compatibility, migrations and recovery. Keep them focused and reviewable. Review business logic, ownership/authorization, queries, error behavior, performance, logging, tests and backward compatibility. Distinguish blocking defects from optional preferences; automation handles routine formatting.

Authors MUST resolve blocking discussions and re-request review after material changes. The author cannot be the only approver. Independent reviewers and appropriate owners evaluate evidence. Failed checks, unresolved blocking comments and missing necessary evidence block merge. Use the [review template](templates/REVIEW-AND-RELEASE.md).

## 6. Unit testing

Source: pp. 20-22.

Developers MUST test important logic alongside changes, covering normal, invalid, boundary and failure cases. Assertions must verify behavior rather than repeat implementation details. Isolate network, time and other external dependencies where needed; keep tests deterministic and order-independent.

A reproducible bug MUST have a regression test demonstrated failing before the fix and passing after it. Coverage supports judgment but does not replace meaningful assertions. Numeric thresholds are pending, not a universal percentage. Required test failures block merge.

## 7. API and integration automation

Source: pp. 23-25.

MUST test authentication, resource authorization, validation, business rules, persistence and response shape/meaning across important API paths. Include missing resources, duplicates, concurrency, pagination and relevant dependency failures.

MUST use isolated databases, repeatable fixtures and cleanup; never production. Test migrations and transactional consistency with real database boundaries where practical. Use controlled third-party stubs and separate provider contract checks. Do not equate mocked persistence tests with real constraint/transaction evidence.

For system migrations specifically, compare old/new outputs on identical inputs with explicit tolerances and reconciliation. This comparison is not mandatory for every ordinary feature.

Backend developers own service/database tests; QA and developers own API regression. Required failures block merge or promotion. Existing commands and database-test prerequisites are in [repository context](REPOSITORY-CONTEXT.md).

## 8. Flutter UI / E2E automation

Source: pp. 26-28. Client-repository responsibility; backend changes must support relevant contract/permission handoff.

Prioritize critical login, configuration, status, alert and permission journeys. Use deterministic users/data, synchronize on observable states and avoid arbitrary long waits. Prefer widget tests for isolated UI behavior and integration tests for complete journeys. Web automation needs verified semantics. Capture useful failure screenshots/logs, maintain stable selectors and give flaky tests an owner; retries must not hide real failures.

QA owns critical E2E regression with developer support. Required journey failures block release. The discoverability gate in section 3 applies before reliable automation handoff.

## 9. Ingestion and device simulator testing

Source: pp. 29-31. Adapt software-side IoT rules to monitor-agent ingestion when relevant; firmware and Python-specific coding standards are outside the handbook's scope.

- MUST define device/event identity, schema version, event time and payload contracts, authenticating and checking ownership. Distinguish event time from receipt time.
- MUST test heartbeat, offline/reconnect, replay/duplicates, delayed/out-of-order events, clock skew, older schemas, invalid credentials/payloads and interrupted recovery.
- MUST bound simulator workloads and isolate test devices/topics/queues. Do not target real production devices.
- MUST define durable acceptance, per-consumer idempotency, ordering/replay policy and notification deduplication. Database writes and notifications are not automatically atomic.
- Where asynchronous consumers/cache exist, define independent consumer scalability, metadata ownership and invalidation. Do not add brokers or caches merely to imitate examples.

Backend and QA own scenarios; DevOps supplies isolation. Broken contracts or critical authorization/state behavior block release.

## 10. API design

Source: pp. 32-34.

MUST use resource-oriented routes and appropriate HTTP methods. Define validation, HTTP statuses, pagination/filter/sort limits, versioning and request IDs; update OpenAPI alongside contracts. Enforce authentication and resource authorization server-side, with bounded result sizes and appropriate rate limits.

Errors MUST expose safe code, message and request ID consistently, without internal stack traces. Retried operations need defined idempotency. Preserve supported-client compatibility or plan a coordinated version transition. Do not rename existing routes or change response envelopes wholesale to match the example `/api/v1/devices`.

Backend owners maintain contracts; client teams and QA review impact. Undocumented breaking changes or authorization gaps block merge.

## 11. PostgreSQL and database standards

Source: pp. 35-37. Apply integrity/migration principles to relevant stores while preserving their actual database semantics.

MUST define naming, keys, uniqueness, timestamps/audit fields and retention/deletion policy. Parameterize queries, use business-operation transactions and review indexes/query plans for important access paths. Version schema changes and test them on a clean temporary database with relevant integration tests.

For v2 Prisma adoption, MUST first inventory and reconcile existing PostgreSQL schemas and migration history. Preserve table/column mappings, native types, constraints, indexes and tenant boundaries. Baseline existing databases without recreating them; validate on an isolated representative copy before any shared-environment change. Prisma adoption does not authorize reset, destructive schema synchronization or running two migration owners against the same schema. Use parameterized Prisma raw SQL only for justified operations not adequately represented by the ORM, with repository-level tests.

Before destructive changes, large updates, type changes, NOT NULL constraints or indexes, assess data volume, locks and availability. SHOULD prefer expand/backfill/validate/contract sequencing and old-code compatibility. A down migration does not guarantee recovery of deleted data.

Backend developers own migrations; reviewers assess safety; DevOps executes approved delivery. Unsafe or untested migrations block release. Existing schema initialization is context to inspect, not proof that migration requirements are already satisfied.

## 12. Error handling and logging

Source: pp. 38-40.

MUST handle known errors, propagate unexpected errors to centralized handling, or retry through a defined policy. Do not swallow exceptions or acknowledge work before its required durable completion. Poison messages need bounded retry and recoverable failure handling where queues exist.

MUST use safe error categories/messages and structured logs with timestamp, level, service, event and request/correlation ID. Propagate correlation through relevant async work. Preserve diagnostic context without returning stacks or logging passwords, tokens, credentials or unnecessary personal data. Bound log volume and define retention/access.

Developers own handling/redaction; DevOps owns collection. Silent failure or credential leakage blocks merge.

## 13. Security

Source: pp. 41-43.

MUST enforce resource-level authorization, input validation, parameterized queries and approved password/token handling. Use approved secret storage, least privilege, encrypted transport/storage and restricted production access. Test privilege escalation and cross-organization access even when the UI hides actions.

Where refresh tokens exist, define hashed credential storage, atomic rotation, expiry/session validation, reuse detection and session-family revocation policy. Coordinate client single-flight refresh and test expiry, rotation, logout, replay and concurrency.

MUST run relevant secret/dependency/static/container/infrastructure checks, protect CI credentials and use short-lived deployment identity where supported. Define severity-based blocking policy and time-bound exceptions with owner, reason and remediation date. Rotate exposed secrets; deleting them from code is insufficient.

Developers own application controls; DevOps owns infrastructure controls; designated approvers own exceptions. Confirmed secrets and unacceptable findings block delivery. Exact tools/severities remain pending.

## 14. Static analysis and quality gates

Source: pp. 44-46.

MUST automate applicable formatting, linting, type analysis and security/maintainability checks using agreed repository tools. SHOULD enforce layer-import boundaries mechanically and verify the rules work. Introduce meaningful checks gradually; inherited minor warnings do not automatically all become blockers. New critical findings require attention.

Record exact required check names, thresholds, owners and exception policy. Failed or missing required checks MUST NOT count as passing. ESLint, formatter and TypeScript examples are not evidence those tools are configured here.

Tech Lead agrees rules, developers fix findings and DevOps enforces gates. Numerical thresholds and final tooling require internal finalization.

## 15. Continuous integration

Source: pp. 47-49.

MUST install locked dependencies with an agreed runtime/toolchain; avoid implicit upgrades. Run relevant formatting, analysis, unit/integration tests, security/static checks and artifact/build validation. Parallelize independent jobs while preserving migration-before-test dependencies. Publish reports and sanitized failure diagnostics.

CI MUST validate the latest PR commit and protect deployment secrets from untrusted PR code. For conditional component jobs, run the workflow on every PR with an always-running aggregate required gate. Change detection and mandatory security jobs must succeed. Every expected component check must succeed; permit skips only for genuinely unaffected work. Failure, cancellation, missing results or an unexpected skip blocks merge.

For this two-service repository, change detection must account for shared root launch/configuration and cross-service behavior, not only service directories. Job names and build-validation commands must be implemented and agreed before they are required. The handbook workflow excerpt is not a complete pipeline.

Developers own component checks; DevOps owns CI infrastructure and protection configuration. These Markdown files do not configure either.

## 16. Continuous deployment

Source: pp. 50-51.

After merge, MUST create a traceable immutable artifact and promote the same artifact through approved environments where practical. Keep environment configuration separate. DEV smoke, QA functional/API/ingestion automation and staging production-like regression/E2E checks precede production according to the agreed mapping.

Production requires designated approval, controlled deployment, smoke checks and a health observation window. Failure stops promotion. For client builds that embed environment configuration, record the same reviewed source plus exact build configuration and validate the actual artifact.

DevOps owns automation, QA supplies evidence and the release owner approves production. Preserve the separate backend deployment roots and coordinate releases when shared contracts change.

## 17. Environment strategy

Source: pp. 52-53.

LOCAL supports developer feedback; DEV integration, QA validation, staging release rehearsal and production real users are the handbook's conceptual roles. Final names and branch mapping remain pending.

MUST isolate databases, secrets, credentials and access; validate required settings and reject production targets in test tooling. Staging must be sufficiently production-like for its checks. Use synthetic or appropriately sanitized data, repeatable fixture resets and recorded deployed versions. Verify credentials cannot cross environment boundaries.

DevOps owns isolation, developers configuration contracts and QA test-data requirements. Incorrect targets/configuration block deployment. Existing `local`/`server` modes do not by themselves establish this environment policy.

## 18. Cloud and infrastructure

Source: pp. 54-55.

MUST use reviewed, repeatable infrastructure changes with relevant validation/diffs and approved deployment. For AWS/CDK this includes synth/diff; other approved platforms need equivalent controls. The source does not choose AWS/CDK over GCP or vice versa.

MUST apply least privilege, network boundaries, encryption, secret storage, tagging and environment isolation. Define backups, test restores, document availability/dependencies/resource limits and review cost. Reconcile authorized emergency console changes into code.

Budget total database connections across service instances and per-instance pools; assess connection-pooler compatibility if introduced. Scaling must respect shared database capacity.

DevOps owns infrastructure; service owners review impact. Unsafe access, failed validation or unapproved production changes block deployment.

## 19. Observability

Source: pp. 56-58.

MUST monitor request/error rates, P95/P99 latency, CPU/memory, database connections/query latency and relevant queue depth/failed jobs. Ingestion needs heartbeat delay, online/offline state, invalid/duplicate events, processing lag and command outcomes where commands exist.

Provide health/readiness checks and cross-service correlation. Readiness represents ability to accept work without leaking sensitive information; HTTP liveness alone does not prove ingestion health. Monitor relevant pool saturation, replication lag, disk/WAL pressure, broker redelivery and Redis eviction only where those components exist.

Alerts MUST define measured thresholds, monitoring windows, owner, response steps and runbook. Monitoring must survive workload failure; test notification routing and backup/restore checks. Avoid high-cardinality IDs as metric labels. An unreachable exporter alone is not proof its database is down.

Developers instrument; DevOps maintains dashboards/alerts; service owners respond. Missing essential detection for a high-risk change blocks release.

## 20. Performance and load testing

Source: pp. 59-60.

MUST define workload using event rate, payload, concurrency, device count and reconnect/burst behavior. Device count alone is not throughput. Load tests assess expected demand, stress tests limits and soak tests sustained degradation.

Measure latency percentiles, errors, throughput, CPU/memory, database load, queue lag and end-to-end processing delay; check simulator capacity too. Derive acceptance criteria from requirements and measured baselines. Run bounded tests in approved environments and verify recovery/backlog drainage after overload. Example device counts are not universal targets.

Backend, QA and DevOps jointly own planning. Failure against agreed release criteria blocks promotion.

## 21. Release and rollback

Source: pp. 61-63.

MUST record version/tag, change references, source commit, artifact digest, migrations, QA results, known issues, approver and deployment/smoke evidence. Before release, define failure signals, recovery action, decision owner and compatibility of the previous application with the new schema.

Use rollback only when safe. Destructive migrations may require a forward fix or restore rather than automatic down migration. Rehearse recovery, retain a compatible prior artifact and use controlled/canary rollout for suitable high-risk changes. Observe a defined health window and preserve incident evidence.

Service documentation must cover setup, configuration, testing and delivery; runbooks must cover diagnosis, rollout, recovery and escalation. Release owner coordinates, QA validates, DevOps deploys/recovers and service owners monitor. Missing recovery plans or unacceptable staging evidence blocks release.

## 22. Technical definition of done

Source: pp. 64-65.

A code change is complete only when applicable acceptance criteria, standards, independent review and required current-commit CI checks are satisfied. Relevant unit/integration/API/client/ingestion tests and critical permission checks must pass. Update API docs/migrations and address security, compatibility, logging, monitoring and recovery needs.

For release readiness, require staging evidence, designated approvals and a recovery plan. For production verification, require actual smoke results and the agreed monitoring window. Mark non-applicable items with a reason. An absent necessary test, unresolved security issue or unimplemented required check is a gap, not completion.

Developers provide evidence; reviewers/QA validate; release owner/DevOps complete operational gates. Use [the evidence template](templates/REVIEW-AND-RELEASE.md). Backend tasks do not acquire Flutter selector work unless they include a coordinated client change.

## Delivery sequence and source boundaries

Source: pp. 66-67.

Define change -> develop and test -> PR/CI and independent review -> merge/DEV smoke -> QA -> staging -> release evidence/approval -> production smoke/monitoring -> record completion. Review may run alongside CI, but both must pass before merge. Failed definition returns to clarification; development/review/QA failures return to fixes; promotion failures hold deployment; production failures invoke the defined safe recovery plan.

Project-management processes and broader architecture governance remain separate. The source's referenced kit, architecture and observability PDFs and executable repositories were not supplied for this task. Do not infer extra mandates or verified automation from those references. Teaching examples are not production-ready generated code, platform choices or historical incident reports.
