# Review and release evidence: <change>

Status: Draft. Supply evidence or an explicit N/A reason for each applicable item. Local verification, merge readiness, release readiness and production verification are separate decisions.

## Change and review

- Work item, purpose and observable behavior:
- Source commit and affected services/API version:
- V2 endpoint inventory and v1 parity coverage:
- Evidence v1 files, routes, dependencies and startup commands are unchanged:
- Prisma schema/baseline review and shared-database compatibility:
- User-controlled client migration and rollback mapping:
- API/database/ingestion impact and compatibility:
- Authorization, secrets, dependency and security impact:
- Independent reviewer and resolved blocking discussions:
- Open decisions, known issues and approved exceptions with expiry:

## Validation evidence

| Check | Exact command or CI job | Commit/environment | Result and evidence | Owner / N/A reason |
|---|---|---|---|---|
| Format/lint/type analysis as configured | | | | |
| Unit and regression tests | | | | |
| Real-database integration/migrations | | | | |
| API contract and permissions | | | | |
| Simulator/replay/recovery where relevant | | | | |
| Secret/dependency/static/container/IaC checks as relevant | | | | |
| Build or deployable-artifact validation | | | | |
| Performance/observability where relevant | | | | |

Report failures, cancellations, missing checks and skips explicitly. Historical results are not evidence for the current commit. Document any unimplemented required gate as a gap, not N/A merely because tooling is absent.

## Code completion and merge gate

- [ ] Acceptance criteria and applicable tests pass.
- [ ] API docs, migrations, configuration and runbooks reflect the change.
- [ ] Authorization, data integrity, safe errors/logging and compatibility are reviewed.
- [ ] Latest-commit required CI checks pass and independent review is complete.
- [ ] Applicable security findings are resolved or covered by an approved, unexpired exception.
- [ ] Client/QA handoff evidence exists where applicable; UI selectors belong to the relevant client repository.

## Release record and recovery plan

- Version/tag, source commit and immutable artifact digest for each service:
- Previous compatible artifact(s):
- Migrations, schema compatibility and configuration version (no secret values):
- DEV/QA/staging evidence according to the approved environment mapping:
- Release owner, production approval evidence and deployment time:
- Failure signals, thresholds, observation window and decision owner:
- Safe rollback action, or forward fix/restore when rollback is unsafe:
- Restore/recovery rehearsal evidence and operational runbook:
- Coordinated deployment order and client compatibility:

## Post-deployment verification

- Deployment results and actual artifact identity:
- Smoke checks and critical authorization/business checks:
- Error rate, latency, ingestion delay and relevant resource trends:
- Monitoring window result and alert routing:
- Recovery performed, incident evidence and remaining corrective work:
- Final status: code complete / merge ready / release ready / production verified (select only evidenced stages).
