import test from "node:test";
import assert from "node:assert/strict";
import { loadLambdaRuntimeSecrets } from "../src/lambda-secrets.js";

test("loads only the V2 runtime configuration fields from Secrets Manager", async () => {
  let requestedArn;
  const config = await loadLambdaRuntimeSecrets({
    secretArn: "arn:aws:secretsmanager:ap-south-2:123456789012:secret:monitor-runtime",
    client: {
      send: async (command) => {
        requestedArn = command.input.SecretId;
        return {
          SecretString: JSON.stringify({
            DATABASE_URL: "postgresql://example.invalid/db",
            HRMS_BACKEND_URL: "http://16.113.19.189",
            MONITOR_SETTINGS_SECRET: "settings-key",
            JWT_SECRET: "must-not-be-copied",
          }),
        };
      },
    },
  });

  assert.equal(requestedArn, "arn:aws:secretsmanager:ap-south-2:123456789012:secret:monitor-runtime");
  assert.deepEqual(config, {
    DATABASE_URL: "postgresql://example.invalid/db",
    HRMS_BACKEND_URL: "http://16.113.19.189",
    MONITOR_SETTINGS_SECRET: "settings-key",
  });
});

test("rejects missing or malformed Lambda runtime secret configuration", async () => {
  await assert.rejects(() => loadLambdaRuntimeSecrets({ secretArn: "", client: { send: async () => ({}) } }), /MONITOR_RUNTIME_SECRET_ARN/);
  await assert.rejects(() => loadLambdaRuntimeSecrets({ secretArn: "secret-id", client: { send: async () => ({ SecretString: "[]" }) } }), /JSON object/);
});
