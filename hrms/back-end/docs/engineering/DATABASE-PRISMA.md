# HRMS persistence and Prisma requirements

Existing persistence is hybrid. This document does not prescribe moving MongoDB data into PostgreSQL or creating new databases.

## MongoDB

Retain Mongoose, collection names, ObjectId identity, document shapes, indexes, validation and organization scoping. Inventory models under `src/modules` plus schema changes in integrations. Preserve references between users, employees, organizations and permission data. Do not rename collections because v2 model names change.

Model initialization must not trigger unreviewed index changes, bootstrap data creation or permission reseeding during coexistence. Compare business queries and serialization against isolated representative fixtures.

## Payroll PostgreSQL

Inspect `src/config/payrollDb.js`, `src/payroll`, `src/payroll/migrations` and payroll services before generating Prisma models. Preserve optional-enable behavior and actual database/tenant-schema routing. Do not assume all tenants share one schema or that payroll and monitor are always the same physical database.

Existing PostgreSQL DATE parsing deliberately preserves `YYYY-MM-DD`; v2 must not introduce timezone shifts. Explicitly map decimal/money precision, BIGINTs, timestamps, nullability, constraints, indexes and transaction isolation. Verify salary formula rounding, effective component timelines, attendance snapshots, run approval/locking, idempotency and audit effects.

## Monitor PostgreSQL

HRMS and desktop access the same monitor records. Coordinate canonical schema ownership and encryption compatibility with [desktop database guidance](../../../../desktop/backend/docs/engineering/DATABASE-PRISMA.md). Preserve monitor ownership checks, screenshot completion integrity and signed-delivery behavior. A v2 writer must remain compatible with both v1 readers and independently deployed services.

## Prisma adoption

All v2 PostgreSQL application access must pass through injected Prisma repositories. Parameterized Prisma raw SQL may handle justified specialized operations with explicit tests; do not retain a parallel direct application `pg` access layer. Underlying drivers required by the chosen Prisma version are a separate concern.

Inventory physical schema and migration histories before generating a baseline. Validate mappings on isolated copies with representative synthetic data. Preserve existing records, names, constraints and database features; do not reset or destructively synchronize a populated database. Document unsupported ORM mappings and retain necessary SQL under a single migration owner.

Package clients per actual logical database/schema topology; avoid request-scoped client creation and unsafe tenant switching. Budget connections across v1/v2, HRMS/desktop, jobs and replicas. Separate client generation from database mutation.

Do not execute existing up/down, seed or cleanup scripts as part of documentation or discovery. Any future schema change needs a v1-compatible plan, lock/data-volume review, backup/restore evidence and explicit execution ownership. MongoDB, PostgreSQL and provider effects are not one atomic transaction; define idempotency and recovery across boundaries.
