# HRMS API v2 development deployment

This pipeline deploys the independent Fastify service from `v2/hrms-api` to the existing HRMS Ubuntu EC2 host. It does not replace HRMS v1, switch clients, run schema migrations, or deploy Monitor v2. The source branch is `development`; the GitHub environment is `hrms-v2-development`.

## Delivery controls

Every pull request runs locked installs, ESLint correctness rules with zero warnings, JavaScript type checking against a reviewed no-new-diagnostics baseline, Prisma schema validation, a high/critical production dependency audit, the full Node test suite against disposable local MongoDB and PostgreSQL with zero skips, deployment regression tests, and an amd64 Docker build when v2 changes. A development push stores the exact validated image as a same-run artifact. The restricted EC2 runner downloads and deploys that artifact; the host does not pull source or rebuild it.

The workflow pins third-party actions to commits, grants read-only repository access, rejects superseded development commits, serializes v2 deployments, and never exposes deployment access to pull-request jobs. Runtime secrets stay in a root-owned host file. Production dependency audit currently blocks high and critical advisories; moderate advisories remain visible and require normal remediation review.

## Host layout

- Current v1 container: `hrms-backend` on loopback port 8000 (unchanged).
- V2 containers: `hrms-api-v2` and retained `hrms-api-v2-previous` on loopback port 8002.
- V2 runtime configuration: `/etc/hrms-api-v2/runtime.env`, owned by root and mode 0600.
- Root-owned receiver: `/usr/local/sbin/hrms-api-v2-receive` from `receive.sh`.
- Root-owned deployer: `/usr/local/sbin/hrms-api-v2-deploy` from `deploy.sh`.
- Runner account: existing unprivileged `actions-runner`; it must not join the Docker group.

Install the reviewed helpers as root, then add exactly this sudo permission in `/etc/sudoers.d/actions-runner-hrms-v2`:

```text
actions-runner ALL=(root) NOPASSWD: /usr/local/sbin/hrms-api-v2-receive
```

Validate it with `visudo -cf /etc/sudoers.d/actions-runner-hrms-v2`. The receiver accepts only a streamed gzip Docker archive and `deploy hrms-api-v2:<40-hex-sha> <same-sha>`; it cannot execute arbitrary commands or replace itself.

Copy the existing HRMS environment values into the separate v2 runtime file without printing or committing them. Add `HOST=0.0.0.0`, `PORT=8002`, and v2-specific CORS values. Reuse the same MongoDB, monitor PostgreSQL, payroll PostgreSQL, JWT/provider configuration only as explicitly approved. Confirm the aggregate MongoDB/PostgreSQL pool capacity for v1 and v2 before raising replica count. Do not run the bootstrap, role seed, hard-delete, or database migration commands during deployment.

## IP routing and later domain

The existing Nginx configuration already uses `/api/v2/` for Monitor v2 GET routing, so two services cannot own that path on one IP. Until a dedicated hostname is configured, add `nginx-location.conf` inside the existing port-80 server block. The temporary public base is:

```text
http://16.113.19.189/hrms-v2/
```

For example, readiness is `http://16.113.19.189/hrms-v2/ready`; Nginx rewrites it to the application's `/api/v2/ready`. Keep port 8002 closed publicly. When a domain is available, create a dedicated server block and proxy its `/api/v2/` directly to `127.0.0.1:8002`; clients can then use the native v2 route without the temporary prefix. Configure HTTPS before real client credentials are sent.

## GitHub configuration

Create the `hrms-v2-development` environment and restrict deployment to `development`. Configure the designated reviewer when one is selected. The existing organization runner group `hrms-production-deployment` must additionally allow `.github/workflows/hrms-v2-development.yml@refs/heads/development`; keep repository access limited to `Rigweda-Technologies/Monitor-Backend`. No new runner, AWS key, EC2 SSH key, ECR repository, or inbound runner port is required.

## Deployment and recovery

The host loads the candidate image before stopping v2. It retains the prior v2 container, starts the candidate on port 8002, and polls `/api/v2/ready`. Failure removes the candidate and restores the previous v2 container when available. This is a single-instance replacement with a short interruption. It never stops or renames the v1 container.

Rollback restores application code only. It cannot undo MongoDB/PostgreSQL writes, sent notifications, provider effects, or incompatible future schema changes. Inspect `docker ps -a`, `docker logs hrms-api-v2`, and local readiness before retrying a failed or interrupted deployment. No automated database migration is part of this pipeline.

## Local verification

```sh
npm ci --prefix hrms/back-end
npm ci --prefix v2/hrms-api
npm run lint --prefix v2/hrms-api
npm run typecheck --prefix v2/hrms-api
npm run prisma:validate --prefix v2/hrms-api
npm run audit:production --prefix v2/hrms-api
# Supply only disposable local databases for test:ci; see .github/workflows/hrms-v2-development.yml.
python3 -m unittest discover -s deploy/hrms-v2/tests -v
bash -n deploy/hrms-v2/deploy.sh
bash -n deploy/hrms-v2/receive.sh
shellcheck deploy/hrms-v2/deploy.sh deploy/hrms-v2/receive.sh
actionlint .github/workflows/hrms-v2-development.yml
docker build --platform linux/amd64 -t hrms-api-v2:local v2/hrms-api
```
