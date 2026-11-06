# Decision register

Source: handbook pp. 2, 45, 53, 55 and 67. This register distinguishes user-selected v2 requirements from unresolved choices; it does not imply organizational approval. Existing implementation conventions are facts to preserve until a scoped change is requested; they are not claims that the Tech Lead approved every current design.

| Topic | Current evidence / constraint | Decision required | Responsible role |
|---|---|---|---|
| V1 framework and persistence | Express + Fastify, MongoDB and `pg` | Preserve unchanged; no in-place migration | User direction, 26 October 2026 |
| V2 framework and persistence | Partial implementation: monitor business endpoints and 13 HRMS auth endpoints; other HRMS domains remain unmigrated. | Selected: Node.js/Fastify; Prisma for PostgreSQL; existing databases retained. See [v2 specification](V2-API-SPEC.md). | User direction, 26 October 2026 |
| V2 isolation and client migration | V1 remains operational | Separate v2 implementation; user controls client cutover. Directory and service layout below are implementation defaults. | User direction / backend owners |
| TypeScript | Both services currently JavaScript | Adoption scope, strict compiler configuration and incremental compatibility approach if adopted | Tech Lead |
| Formatting and analysis | HRMS v1 and HRMS v2 use correctness-focused ESLint and reviewed no-new-diagnostic JavaScript typecheck baselines | Formatter, layer-import enforcement, and any stricter type policy remain pending | Tech Lead / developers |
| Coverage | Existing Node test suites | Meaningful per-service targets and treatment of legacy gaps; no invented percentage | Tech Lead / QA |
| Security gates | Controls required by baseline | Scanner tools, severity rules, required checks, exception approver, expiry and remediation process | Security owner / DevOps |
| Branching | Remote protections not inspected | Protected-main versus develop/main, merge strategy, CODEOWNERS identities, stale approval enforcement | Tech Lead / repository admin |
| Environments | HRMS v2 development deploys from `development` to the existing HRMS EC2 host without client cutover | QA/staging/production mapping and isolated resources remain pending; launcher modes are not environments | User direction, 1 November 2026 / DevOps |
| Cloud and artifacts | HRMS v2 development uses the existing restricted EC2 self-hosted runner and an immutable same-run Docker artifact | Registry and promotion architecture for later environments remain pending | User direction, 1 November 2026 / DevOps |
| Deployment approval | Not identified by source | Named release owner, production approvers and authorized emergency process | Engineering leadership |
| Reliability/performance | No numerical targets adopted here | Service objectives, P95/P99 targets, load model, alert windows, pool/instance budget and recovery objectives | Service owners / QA / DevOps |
| Data lifecycle | Existing stores and migration paths | Retention/deletion policy, backup/restore verification, migration execution ownership | Data/service owners |
| Refresh/session policy | Existing authentication must be inspected per change | Rotation/reuse handling, family revocation and client coordination across supported clients | Backend / client owners |
| Flutter choices | No Flutter implementation in this backend repository | Client-side architecture and verified test tool/selector strategy belong with the relevant client team | Client team / QA |

## Recording a decision

For each resolved choice record: decision ID, status, scope, selected policy/tool, rationale, owner, approval evidence/date, configuration location, required check names, rollout plan and review date. Replace pending values only with real evidence.

For a time-bound exception record: affected rule, scope, reason, risk, compensating controls, approving authority, owner, remediation date and expiry. An undocumented exception or missing required check is not a passing gate.

Code generation may proceed on independent behavior using current repository conventions. If an unresolved choice materially changes the requested output, surface that specific decision before implementing the dependent behavior.
