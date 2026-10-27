# HRMS v1 deployment to Ubuntu EC2

This pipeline deploys the **existing Express HRMS API**, not v2. The user selected `production`, Ubuntu and Docker. Development specification: [CICD-AWS.md](../../hrms/back-end/docs/engineering/CICD-AWS.md).

## What runs

Every PR runs the required `HRMS quality gates` job, without deployment credentials. Pushes to `production` and manual runs on `production` also deploy after that job succeeds. Other manual branches only validate. There are no path filters that silently omit a required check.

Gates: locked install, ESLint, JavaScript type checking, production npm audit (high/critical block), HRMS and coupled desktop tests with isolated PostgreSQL and zero skips, deployment regression tests, and Docker build. The deploy job runs on the EC2 self-hosted runner, consumes the exact image archive built by the quality job and invokes the root-owned receiver through a narrow sudo rule. A superseded production commit is rejected before publishing. GitHub serializes deploy jobs; the instance script also takes a lock.

Type checking currently records 243 known legacy diagnostics across 248 source files. `npm run typecheck` rejects changes to this baseline; `npm run typecheck:strict` exposes all debt and currently fails. CI never regenerates the baseline. Adding/removing entries requires code review; fix diagnostics and remove their entries rather than suppressing new errors. The existing overwritten Swagger `paths` key has one documented lint exception to preserve the current exported contract. Formatting and full TypeScript strictness are not claimed.

## Configured deployment

- Repository: `Rigweda-Technologies/Monitor-Backend`; deployment branch: `production`.
- EC2: `i-09702b28362fdda43`, Hyderabad (`ap-south-2`), Ubuntu x86_64, `16.113.19.189`.
- Runner: dedicated systemd self-hosted runner on this EC2 instance, registered to the organization group `hrms-production-deployment`.
- Runner group: selected repository `Monitor-Backend`, restricted to `.github/workflows/hrms-production.yml@refs/heads/production`. The runner is not available to other repositories or workflows.
- GitHub environment: `hrms-production`, restricted to the `production` branch.
- No EC2 SSH key or AWS credential is used by the active deployment workflow. GitHub-hosted quality jobs still produce the image artifact; the runner downloads it over outbound HTTPS.
- Runner software: GitHub Actions runner `2.338.2`, installed under `/opt/actions-runner`; runner registration is organization scoped and assigned to the restricted group above.
- Service account: `actions-runner` (no login shell, not in the Docker group). Its only sudo permission is `/usr/local/sbin/hrms-ci-receive` through `/etc/sudoers.d/actions-runner`.
- systemd unit: `actions.runner.Rigweda-Technologies.hrms-ec2-ap-south-2.service`, enabled at boot.
- Instance configuration: `/etc/hrms-backend/runtime.env`, root-owned mode 0600.
- Containers: `hrms-backend`, with `hrms-backend-previous` retained for rollback.

No AWS access keys, ECR repository or instance IAM role are required by the active SSH workflow. Optional `ssm-deploy.py` and the ECR path in `deploy.sh` remain tested utilities for a future OIDC/ECR/SSM migration; they are not used by this workflow and their IAM resources have not been provisioned.

## Instance setup and access

The instance has Docker Engine, Nginx, curl, AWS CLI and the existing SSM Agent. PostgreSQL is **not** installed: the user uses Aiven. The runtime configuration was derived from the explicitly supplied local `.env` without committing or printing secrets. Its localhost payroll URL is overridden on the instance with the same hosted Aiven target used by monitor, with the existing v1 TLS `require` behavior. The local source `.env` is unchanged. Existing local payroll data has not been copied; the inspected Aiven database contained monitor tables. This setup does not apply payroll schema migrations.

Firebase's multiline private key is represented as escaped newlines in Docker's env file; existing application code decodes it. Other multiline settings require separate handling. Keep database, JWT, SMTP, provider and encryption settings in the protected runtime file. Do not change encryption keys accidentally.

The container forces `NODE_ENV=production` and `PORT=8000`; no `.env` enters the image. V1 bootstrap and permission synchronization can write on startup. Verify existing accounts and data; the pipeline does not automatically run migration/cleanup commands. Existing v1 PostgreSQL `require` mode encrypts transport but does not validate the server certificate; verified Aiven CA handling is separate hardening, not claimed here.

The runner runs as its dedicated unprivileged `actions-runner` account, which is not a Docker-group member. Its sudo rule permits only the root-owned receiver. The receiver validates arguments, locks transfer, loads the image, verifies the source commit in its tag and invokes the root-owned deployment script, which checks the image revision label. GitHub's organization runner group limits which repository and workflow can schedule jobs on the instance. Review production changes and keep this group restricted.

The organization group is named `hrms-production-deployment`, allows only repository `Rigweda-Technologies/Monitor-Backend`, and restricts workflow access to `.github/workflows/hrms-production.yml@refs/heads/production`. The deploy job must select that group and the `hrms-production` runner label. If the workflow path or production ref changes, update the group restriction before merging; otherwise the deploy job remains queued. Pull request tests continue on GitHub-hosted runners. Do not add the production runner group to other workflows.

The runner service connects outbound to GitHub; no inbound runner port is opened. To inspect it, use `systemctl status actions.runner.Rigweda-Technologies.hrms-ec2-ap-south-2.service` and `journalctl -u actions.runner.Rigweda-Technologies.hrms-ec2-ap-south-2.service`. Re-register with a fresh short-lived organization runner token if GitHub removes it. Remove the runner from the organization and group before uninstalling the service or deleting `/opt/actions-runner`.

Root-owned deployment files:

- `/usr/local/sbin/hrms-ci-receive` from `receive.sh`
- `/usr/local/sbin/hrms-deploy` from `deploy.sh`

The runner service and deployment receiver are separate: CI cannot replace the root-owned receiver through arbitrary commands. Changes to these helpers require an operator to install the reviewed versions.

## Networking

Nginx listens on host port 80 and proxies to Docker's loopback binding `127.0.0.1:8000`. WebSocket forwarding and the 25 MiB body limit are configured in [nginx.conf](nginx.conf). The requested initial endpoint is `http://16.113.19.189`; no HTTPS/domain certificate has been configured.

AWS security groups must allow TCP 80 from intended API clients. The self-hosted runner requires outbound HTTPS to GitHub Actions and artifact storage, Aiven, MongoDB Atlas and application providers. No inbound TCP 22 rule is needed for CI deployment; SSH remains available for operator access according to the existing security-group rule. Docker port 8000 need not be public.

The host firewall is checked separately from AWS security groups. SSH access does not grant permission/API credentials to edit EC2 security groups. If HTTP cannot be reached externally while localhost works, update the AWS inbound rule and verify NACL/routing. Outbound access must reach GitHub image transfer, Aiven, MongoDB Atlas and application providers; database allowlists may also need the instance egress IP.

## GitHub protection

The `hrms-production` environment has a production-only deployment branch policy. Configure branch protection for `production` with independent review and required status `HRMS quality gates`; repository billing/organization policies may constrain this feature. No review identities or bypass policy are invented. Require review for workflow, deployment, dependencies and diagnostic-baseline changes. The workflow itself rejects non-production deployments, does not expose the deployment key to PR jobs, and pins third-party actions to commit SHAs.

## Deployment and recovery

The quality job builds the Linux amd64 Docker image and saves it as an immutable same-run Actions artifact. The organization-scoped runner downloads that artifact and streams it to the restricted local receiver, which loads the image and verifies its source commit tag and revision label. There is no server-side Git pull, dependency install or image rebuild.

The instance loads the new image before stopping the current container. It keeps the old container as `hrms-backend-previous`, starts the replacement and polls `/ready` for up to 30 attempts (3-second request timeout, 2-second spacing). A failed start/readiness check removes the replacement, restores the previous container if present, checks recovery and exits nonzero. First deployment has no previous container. This single-instance design has a short interruption; it is not zero-downtime deployment.

A source commit that is no longer the production head is rejected before transfer. GitHub serializes production jobs and instance locks prevent concurrent replacement. A lost SSH connection fails the workflow; inspect actual container state before retrying because remote execution may already have completed. Infrastructure failure and database/provider effects cannot be fully repaired by container rollback.

For manual recovery, pause deployments, inspect container state and restore the retained container with operator access. Verify readiness, critical login/API behavior and data compatibility. Routing back does not undo database writes or notifications. Runtime configuration is fixed when a container is created; rollback containers retain their previous environment.

The workflow records source commit, image ID and host. Define sustained monitoring/alerts before production use. Keep enough disk for current/previous releases and builds; this instance initially has a small root volume, so monitor disk usage and expand it as needed. Do not indiscriminately prune rollback images.

## Local checks

```sh
npm run setup
npm run lint --prefix hrms/back-end
npm run typecheck --prefix hrms/back-end
npm run audit:production --prefix hrms/back-end
# Supply a local disposable PostgreSQL URL with database name hrms_ci:
MONITOR_OWNERSHIP_TEST_URL=postgresql://postgres:ci-only-password@127.0.0.1:5432/hrms_ci npm run test:ci --prefix hrms/back-end
MONITOR_OWNERSHIP_TEST_URL=postgresql://postgres:ci-only-password@127.0.0.1:5432/hrms_ci node hrms/back-end/ci/run-tests.cjs desktop
python3 -m unittest discover -s deploy/hrms/tests -v
bash -n deploy/hrms/deploy.sh
shellcheck deploy/hrms/deploy.sh
actionlint .github/workflows/hrms-production.yml
docker build -t hrms-ci hrms/back-end
```

## Primary references

- [GitHub OIDC with AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- [GitHub self-hosted runner groups](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/manage-access)
- [GitHub runner service setup](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/configure-the-application)
- [GitHub deployment environments and concurrency](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments)
- [AWS ECR registry authentication](https://docs.aws.amazon.com/AmazonECR/latest/userguide/registry_auth.html)
- [AWS Run Command status](https://docs.aws.amazon.com/systems-manager/latest/userguide/monitor-commands.html)
- [TypeScript JavaScript checking](https://www.typescriptlang.org/tsconfig/checkJs.html)
