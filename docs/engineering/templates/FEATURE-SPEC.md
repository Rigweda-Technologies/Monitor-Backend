# Feature specification: <name>

Status: Draft. Replace placeholders before using this document as implementation requirements. This template does not approve a feature or deployment.

## Behavior and scope

- Request/work item:
- Problem and intended behavior:
- API version (new migration work targets v2):
- Affected v2 service/module paths and read-only v1 reference paths:
- V1 route -> v2 route mapping and parity evidence:
- Inputs, outputs and concrete before/after examples:
- Acceptance criteria, including failure and boundary cases:
- Explicitly excluded work:
- Relevant handbook section numbers from [the standards](../STANDARDS.md):
- Pending decisions or assumptions requiring resolution:

## Contract and authorization

- Routes/methods, request/response schemas and OpenAPI changes:
- Validation limits, status codes, error codes and request correlation:
- Verified principal, organization/employee/device ownership and permissions:
- Missing/expired/revoked session and cross-organization denial behavior:
- Pagination/filter/sort bounds and rate limits where applicable:
- Supported clients and backward compatibility/version transition:

## Implementation and persistence

- Function-first controller/service/repository responsibilities:
- Dependencies to inject; external-call timeouts and failure behavior:
- Existing PostgreSQL tables/schemas mapped through Prisma; MongoDB/Mongoose models retained:
- Data constraints, indexes, transactions and concurrency:
- Proof v1 files/configuration/dependencies are unchanged and v2 writes remain v1-compatible:
- Migration, representative data/lock assessment and old-code compatibility:
- Retry limits, idempotency key/scope, ordering, event-time/receipt-time rules:
- Durable acknowledgment, replay, partial failure and recovery where applicable:
- Secret handling, sensitive-data redaction and retention impact:

## Verification plan

| Scenario | Test level and location | Expected observable outcome |
|---|---|---|
| Normal business behavior | Fill in | Fill in |
| Invalid and boundary input | Fill in | Fill in |
| Unauthorized/cross-organization access | Fill in | Fill in |
| Duplicate/concurrent request, if relevant | Fill in or explain N/A | Fill in |
| Dependency failure/recovery | Fill in or explain N/A | Fill in |
| Migration and contract compatibility | Fill in or explain N/A | Fill in |

Record exact commands, isolated database/fixture setup, third-party stubs, cleanup and expected skips. For a bug fix record failing-before and passing-after evidence. For telemetry include reconnect, replay, delayed/out-of-order events and invalid identity. For a system migration include old/new comparison tolerances and reconciliation.

## Operations and handoff

- Safe logs, metrics, readiness, alert owner and runbook impact:
- Workload model and acceptance targets if performance-sensitive:
- Coordinated service/client rollout and configuration changes:
- Recovery trigger, compatible previous artifact or forward-fix/restore approach:
- Required reviewers, QA evidence and completion criteria:
