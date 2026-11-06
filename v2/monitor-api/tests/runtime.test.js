import test from "node:test";
import assert from "node:assert/strict";
import { startServer } from "../src/server.js";

test("the shared V2 runtime starts on EC2 and serves the health route without opening a database connection", async () => {
  const app = await startServer({
    logger: false,
    config: {
      databaseUrl: "postgresql://user:pass@127.0.0.1:1/monitor_test",
      databaseSsl: false,
      databaseSslRejectUnauthorized: true,
      databasePoolMax: 1,
      hrmsBackendUrl: "http://127.0.0.1:1",
      hrmsRequestTimeoutMs: 100,
      monitorSettingsSecret: "test-settings-secret",
      apiBaseUrl: "http://localhost",
      corsOrigins: [],
      host: "127.0.0.1",
      port: 0,
    },
  });

  try {
    const response = await app.inject({ method: "GET", url: "/api/v2/health" });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: "healthy" });
  } finally {
    await app.close();
  }
});
