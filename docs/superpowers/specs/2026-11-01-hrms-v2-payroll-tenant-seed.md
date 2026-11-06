# HRMS V2 payroll tenant synchronization command

## Behavior and acceptance criteria

- Port V1's all-organization payroll tenant synchronization as an explicit V2 CLI.
- Default execution is read-only dry-run. `--apply` is required for writes; payroll must also be explicitly enabled and configured.
- Preserve V1 upsert fields and update behavior for each Mongo organization. Use Prisma and parameterized PostgreSQL SQL.
- Support targeting one validated organization ID. Process organizations sequentially and report the number completed if a later upsert fails.
- Keep V1 unchanged; do not synchronize during V2 API startup.

## Verification

- Unit tests cover dry-run, targeting, sequential writes, repository parameterization, and failure boundaries.
- The isolated PostgreSQL integration applies V1 payroll DDL to a disposable database and verifies tenant insert/update behavior.
