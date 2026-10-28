# Monitor V2 deployment

The development pipeline deploys HRMS to the existing EC2 Docker app, the Monitor V2 Fastify app to EC2 for GET requests, and the same V2 app through Lambda for POST requests. API Gateway exposes one HTTPS base URL for Monitor V2 and routes `GET /api/v2/{proxy+}` to the EC2 Nginx origin and `POST /api/v2/{proxy+}` to Lambda. Nginx only exposes GET for the EC2 V2 origin; direct POST requests there receive 403. HRMS V1 remains on EC2 under `/api/v1`.

V2 request schemas and response handlers are shared between the EC2 and Lambda processes. The Lambda entry point uses `@fastify/aws-lambda`; it does not start an HTTP listener. Prisma is generated during CI and the Lambda process loads its allowlisted runtime configuration from Secrets Manager.

## Lambda payload limit

API Gateway allows requests up to 10 MB, but synchronous Lambda invocation events are limited to 6 MB. Binary multipart data is base64 encoded inside the Lambda event, so the usable screenshot size is lower than 6 MB. This limit is enforced before Fastify runs. The V2 direct screenshot route keeps its current schema and response, but requests over the Lambda event limit receive an AWS platform error. Validate actual screenshot sizes after rollout; the current direct route's Fastify limit is 25 MiB.

## One-time AWS bootstrap

An AWS administrator must deploy [bootstrap.yaml](bootstrap.yaml) in `ap-south-2`. It creates:

- A GitHub OIDC provider if one is not supplied, and a deployment role trusted only for pushes to `Rigweda-Technologies/Monitor-Backend`'s `development` branch.
- A CloudFormation execution role scoped to the Monitor V2 Lambda/API Gateway resources.
- A private, encrypted SAM artifact bucket with 30-day artifact expiry.
- A Secrets Manager runtime secret.

Set `MonitorRuntimeConfigJson` in the stack to a JSON object containing `DATABASE_URL`, `HRMS_BACKEND_URL`, and `MONITOR_SETTINGS_SECRET`. Copy the Aiven URL from `MONITOR_DATABASE_URL` in the existing HRMS runtime configuration, set the HRMS V1 origin ending in `/api/v1`, and use the existing compatible settings key. Add database TLS and pool settings if required. The parameter is `NoEcho`; enter it through the AWS console or another secure parameter-entry path, not a shell command recorded in history. The bootstrap file and GitHub workflow never contain the secret values.

If the account already has the GitHub OIDC provider, set `ExistingGithubOidcProviderArn` to its ARN. Otherwise leave it empty and the stack creates the provider. The user deploying the bootstrap stack needs IAM, S3, Secrets Manager, and CloudFormation permissions.

Set these non-secret **repository variables** after the stack completes:

| Variable | Value |
|---|---|
| `MONITOR_AWS_DEPLOY_ROLE_ARN` | `GithubDeployRoleArn` stack output |
| `MONITOR_CFN_EXECUTION_ROLE_ARN` | `StackExecutionRoleArn` stack output |
| `MONITOR_ARTIFACT_BUCKET` | `ArtifactBucketName` stack output |
| `MONITOR_RUNTIME_SECRET_ARN` | `RuntimeSecretArn` stack output |
| `MONITOR_CORS_ORIGINS` | Comma-separated exact origins allowed by Monitor V2 |
| `MONITOR_LAMBDA_RESERVED_CONCURRENCY` | Maximum Lambda concurrency based on the shared Aiven connection budget |

The repository does not currently have AWS CLI credentials or an EC2 instance profile with Lambda/IAM permissions. Therefore this bootstrap and the Lambda stack must be applied only after an AWS-authorized session is available. The GitHub-hosted deployment job assumes the OIDC role; no AWS access key is stored in GitHub.

## EC2 runtime and routing

The EC2 container reads `/etc/monitor-v2/runtime.env`, mode `0600`, with:

- `DATABASE_URL` — same Aiven Monitor database as the Lambda runtime secret.
- `HRMS_BACKEND_URL` — the EC2 HRMS V1 origin ending in `/api/v1`.
- `MONITOR_SETTINGS_SECRET` — key compatible with encrypted Monitor tenant settings.
- `PUBLIC_API_URL` — the deployed API Gateway base URL for Swagger metadata.
- `CORS_ORIGINS` — exact browser origins.
- `DATABASE_POOL_MAX` — EC2 pool ceiling.

Nginx routes `/api/v2/` GET requests to `127.0.0.1:3002`; POSTs are denied at EC2 and served at the API Gateway URL. HRMS remains on `127.0.0.1:8000`. The API Gateway GET integration uses the EC2 HTTP origin already opened for the HRMS service. Lambda reaches Aiven using its normal outbound access; if Aiven IP allowlisting blocks it, configure a VPC route with stable NAT egress and allow that egress IP before enabling deployments.

## Pipeline and rollback

`.github/workflows/monitor-v2.yml` runs locked install, Prisma generation/validation, V2 tests with isolated PostgreSQL, deployment receiver regression tests, SAM validation/build and the production image build. A successful development push deploys the GET app to EC2 first, checks `/api/v2/ready`, then updates Lambda/API Gateway. Failed EC2 readiness restores the retained container and fails the workflow. A failed Lambda stack update is reported by CloudFormation and does not undo the EC2 image; the previous Lambda code remains managed by CloudFormation rollback.

The first EC2 installation must place `receive.sh` and `deploy.sh` as root-owned files at `/usr/local/sbin/monitor-v2-ci-receive` and `/usr/local/sbin/monitor-v2-deploy`, grant the runner account only the receiver command in sudoers, install the updated Nginx config, and create the protected runtime env file. Do not expose port 3002 publicly. Keep v1 and the existing HRMS container in service during this setup.
