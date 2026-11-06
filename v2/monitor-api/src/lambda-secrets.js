import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const allowedRuntimeConfigKeys = [
  "DATABASE_URL",
  "DATABASE_SSL",
  "DATABASE_SSL_REJECT_UNAUTHORIZED",
  "DATABASE_POOL_MAX",
  "HRMS_BACKEND_URL",
  "HRMS_REQUEST_TIMEOUT_MS",
  "MONITOR_SETTINGS_SECRET",
  "CORS_ORIGINS",
];

export const loadLambdaRuntimeSecrets = async ({
  secretArn = process.env.MONITOR_RUNTIME_SECRET_ARN,
  client = new SecretsManagerClient({}),
} = {}) => {
  if (typeof secretArn !== "string" || !secretArn.trim()) {
    throw new Error("MONITOR_RUNTIME_SECRET_ARN is required.");
  }

  const result = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
  if (typeof result.SecretString !== "string") {
    throw new Error("Monitor runtime secret must contain a JSON object.");
  }

  let parsed;
  try {
    parsed = JSON.parse(result.SecretString);
  } catch {
    throw new Error("Monitor runtime secret must contain a JSON object.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Monitor runtime secret must contain a JSON object.");
  }

  return Object.fromEntries(allowedRuntimeConfigKeys
    .filter((key) => typeof parsed[key] === "string" && parsed[key].trim())
    .map((key) => [key, parsed[key].trim()]));
};
