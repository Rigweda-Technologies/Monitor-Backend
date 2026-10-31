# Monitor V2 deployment

The development pipeline deploys HRMS changes to the existing EC2 Docker app. For Monitor V2 changes, it deploys the Fastify app to EC2 for GET requests and the same V2 app through Lambda for POST requests; Monitor-only changes do not rebuild or redeploy HRMS. The HRMS workflow still runs its tests, while its HRMS production dependency audit, image build and deployment run only when HRMS, desktop integration, shared root package, or HRMS deployment paths change. API Gateway exposes one HTTPS base URL for Monitor V2 and routes `GET /api/v2/{proxy+}` to the EC2 Nginx origin and `POST /api/v2/{proxy+}` to Lambda. Nginx only exposes GET for the EC2 V2 origin; direct POST requests there receive 403. HRMS V1 remains on EC2 under `/api/v1`.

V2 request schemas and response handlers are shared between the EC2 and Lambda processes. The Lambda entry point uses `@fastify/aws-lambda`; it does not start an HTTP listener. Prisma is generated during CI and the Lambda process loads its allowlisted runtime configuration from Secrets Manager.

## Lambda payload limit

API Gateway allows requests up to 10 MB, but synchronous Lambda invocation events are limited to 6 MB. Binary multipart data is base64 encoded inside the Lambda event, so the usable screenshot size is lower than 6 MB. This limit is enforced before Fastify runs. The V2 direct screenshot route keeps its current schema and response, but requests over the Lambda event limit receive an AWS platform error. Validate actual screenshot sizes after rollout; the current direct route's Fastify limit is 25 MiB.

## One-time AWS bootstrap

An AWS administrator must deploy [bootstrap.yaml](bootstrap.yaml) in `ap-south-2`. It creates:

- A GitHub OIDC provider if one is not supplied, and a deployment role trusted only for the `development` branch using this repository's immutable GitHub OIDC subject (`Rigweda-Technologies@290628100/Monitor-Backend@1433043932`).
- A CloudFormation execution role scoped to the Monitor V2 Lambda/API Gateway resources.
- A private, encrypted SAM artifact bucket with 30-day artifact expiry.
- A Secrets Manager runtime secret.

Set `MonitorRuntimeConfigJson` in the stack to a JSON object containing `DATABASE_URL`, `HRMS_BACKEND_URL`, and `MONITOR_SETTINGS_SECRET`. Copy the Aiven URL from `MONITOR_DATABASE_URL` in the existing HRMS runtime configuration, set the HRMS V1 origin ending in `/api/v1`, and use the existing compatible settings key. Add database TLS and pool settings if required. The parameter is `NoEcho`; enter it through the AWS console or another secure parameter-entry path, not a shell command recorded in history. The bootstrap file and GitHub workflow never contain the secret values.

If the account already has the GitHub OIDC provider, set `ExistingGithubOidcProviderArn` to its ARN. Otherwise leave it empty and the stack creates the provider. This repository uses GitHub's immutable OIDC subject format, so the trust policy includes its owner and repository IDs. The user deploying the bootstrap stack needs IAM, S3, Secrets Manager, and CloudFormation permissions.

The CloudFormation execution role grants `cloudformation:CreateChangeSet` on the AWS-owned `Serverless-2016-10-31` transform ARN so CloudFormation can process the SAM template. This permission is limited to that transform resource.

The GitHub deployment role can call `cloudformation:GetTemplateSummary` on the Monitor V2 stack. SAM uses this operation before it creates the stack change set. If the bootstrap stack was created before this permission was added, update IAM → Roles → `monitor-v2-development-github-deploy` → Permissions → `DeployMonitorV2Stack` → Edit JSON. Add `"cloudformation:GetTemplateSummary"` to the `Action` array in the `ManageMonitorStack` statement, retaining its existing stack-scoped `Resource` entries.

The execution role also manages API Gateway v2 tags on resources whose ARN is under `/v2/apis/`. API Gateway uses a separate `/v2/tags/{resource-arn}` endpoint for tags, so the bootstrap policy scopes those tag operations to Monitor HTTP APIs only. If the bootstrap stack was created before this permission was added, updating this file does not change the existing role automatically. Before retrying Lambda deployment, update IAM → Roles → `monitor-v2-development-cfn-execution` → Permissions → `MonitorV2StackResources` and add this statement to its `Statement` array, retaining the existing statements:

```json
{
  "Sid": "ManageMonitorHttpApiTags",
  "Effect": "Allow",
  "Action": [
    "apigateway:DELETE",
    "apigateway:GET",
    "apigateway:POST"
  ],
  "Resource": "arn:aws:apigateway:ap-south-2::/tags/arn%3Aaws%3Aapigateway%3Aap-south-2%3A%3A%2Fv2%2Fapis%2F*"
}
```

This updates the already-created role without recreating the bootstrap stack or changing runtime secrets.

The execution role also needs `apigateway:PUT` on the API Gateway v2 `/apis` collection path to create the HTTP API. The API resource operations remain scoped to `/apis/*`; this additional permission is only for the collection path. If the bootstrap stack predates this permission, add the following statement to IAM → Roles → `monitor-v2-development-cfn-execution` → Permissions → `MonitorV2StackResources`, retaining the current statements:

```json
{
  "Sid": "CreateMonitorHttpApi",
  "Effect": "Allow",
  "Action": "apigateway:PUT",
  "Resource": "arn:aws:apigateway:ap-south-2::/apis"
}
```

This updates the existing execution role without recreating the bootstrap stack or changing runtime secrets.

CloudFormation also tags the API Gateway stage. If the bootstrap stack predates this permission, add the following statement to IAM → Roles → `monitor-v2-development-cfn-execution` → Permissions → `MonitorV2StackResources`, retaining the existing statements:

```json
{
  "Sid": "ManageMonitorHttpApiResourceTags",
  "Effect": "Allow",
  "Action": [
    "apigateway:TagResource",
    "apigateway:UntagResource"
  ],
  "Resource": "arn:aws:apigateway:ap-south-2::/apis/*"
}
```

This permits tag updates only on Monitor API Gateway resources under `/apis/`.

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

### Console setup checklist

1. In the AWS console, switch to `ap-south-2` and open **IAM → Identity providers**. If `token.actions.githubusercontent.com` already exists, copy its provider ARN; otherwise leave `ExistingGithubOidcProviderArn` blank so the bootstrap stack creates it.
2. Open **CloudFormation → Create stack → With new resources**, upload `bootstrap.yaml`, and set stack name `monitor-v2-bootstrap`.
3. For `MonitorRuntimeConfigJson`, enter a JSON object using the existing HRMS `.env` values locally. Map `MONITOR_DATABASE_URL` to `DATABASE_URL`, the EC2 HRMS V1 origin ending in `/api/v1` to `HRMS_BACKEND_URL`, and the existing compatible `JWT_SECRET` to `MONITOR_SETTINGS_SECRET`. Add `DATABASE_SSL: true`, `DATABASE_SSL_REJECT_UNAUTHORIZED: true`, `DATABASE_POOL_MAX`, and `CORS_ORIGINS` as needed. This parameter is marked `NoEcho`; do not paste it into chat, GitHub, or a terminal command.
4. After the stack reaches `CREATE_COMPLETE`, copy its four outputs into the matching GitHub **repository variables** in the table above. Set `MONITOR_CORS_ORIGINS` to the exact production frontend origins. Set Lambda reserved concurrency and its DB pool ceiling to stay within the Aiven connection limit.
5. After `monitor-v2.yml` is merged into `development`, edit **Organization Settings → Actions → Runner groups → `hrms-production-deployment` → Workflow access**. Keep the existing HRMS workflow entry and add `Rigweda-Technologies/Monitor-Backend/.github/workflows/monitor-v2.yml@refs/heads/development`. This group intentionally restricts access to named workflows.
6. The workflow skips both deployment jobs until all six repository variables are set, while still running quality gates. After bootstrap and runner-group setup, use **Actions → Monitor V2 quality and deployment → Run workflow** on `development` (or merge a new development commit) to deploy. The workflow runs quality gates, deploys EC2 GET, then Lambda POST routes. Check the Actions run and `MonitorApiBaseUrl` CloudFormation output for deployment evidence.

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
