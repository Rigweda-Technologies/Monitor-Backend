# HRMS v1 CI/CD development specification

Date: 26 October 2026. User-selected target: **production branch, Ubuntu EC2, Docker**. This task explicitly authorizes CI/CD changes to v1; it does not migrate Express, MongoDB or PostgreSQL to v2.

## Goal and architecture

Run genuine quality gates on pull requests and branch pushes. Only a successful `production` push may publish/deploy. Use a dedicated restricted SSH identity and pinned host key to stream the validated Docker image to Ubuntu. Deploy by a commit-specific tag with a verified source-revision label, never a floating tag. This replaces the initial OIDC/ECR/SSM proposal because the supplied access is SSH and the instance has no IAM role.

The production job uses a GitHub environment named `hrms-production`. Environment variables supply EC2 host, restricted user and pinned host identity; a dedicated secret supplies its SSH key. Operators provision those resources and the instance configuration; no real credentials or AWS changes are needed to implement/test this repository change.

## Quality gates

- Locked installs on the agreed Node runtime.
- ESLint correctness rules, with zero warnings.
- TypeScript `allowJs`/`checkJs` without emitting code. Existing legacy diagnostics, if substantial, are recorded in a reviewed baseline; any additional diagnostic fails. This is a no-new-type-errors gate, not a claim of full type safety. Baseline changes require review.
- HRMS and coupled desktop regression suites, with isolated PostgreSQL ownership tests enabled; skipped tests must fail CI.
- Production dependency audit blocking high/critical advisories; no silent audit bypass.
- Deployment script regression tests covering successful replacement, failed readiness rollback and invalid input.
- Docker image builds from an explicit allowlist without local secrets, dumps or test data. No build/deploy on PR failures or canceled checks.

## Deployment behavior

After all gates pass, load the image artifact built by the quality job, verify its commit-specific tag and source revision label, then stream the archive to the restricted instance receiver. The receiver and deployment script are root-owned, operator-installed files. Serialize production deployments and acquire an instance lock. Keep an existing container for rollback, stop it before starting the replacement on the configured port, and verify `/ready` before recording success. This single-instance process has a short interruption; it is not zero-downtime or database rollback.

Production environment variables live in a protected instance-local file, not in the image or GitHub artifact. Do not run automatic schema migrations or cleanup scripts. Existing application startup side effects remain a deployment consideration. Container rollback cannot undo database changes, bootstrap writes or external effects.

## Implementation plan

- [ ] Add local lint/typecheck/audit/test commands and a reproducible tooling lockfile; characterize legacy diagnostics explicitly.
- [ ] Write failing deployment regression tests, implement validated Docker replacement/readiness/rollback, then pass tests.
- [ ] Add Docker packaging and PR/production GitHub Actions workflow with isolated tests and fail-closed gates.
- [ ] Document AWS/OIDC/ECR/SSM/Ubuntu setup, required variables, secrets location, branch protection and recovery.
- [ ] Verify available checks locally; record unavailable AWS/Docker verification without claiming deployment.

## Acceptance criteria

A failed check prevents publishing/deployment. PR jobs receive no deployment credentials. Only `production` can deploy. The deployed reference is the commit-specific image tag from the validated artifact. Instance commands and inputs are validated, concurrent replacement is blocked, health failures produce a failed workflow and restore the previous container when available. Documentation includes every manual infrastructure prerequisite.

## Verification record

To be completed after implementation. This document is the development specification and execution checklist, not an assertion that AWS resources or production configuration already exist.
