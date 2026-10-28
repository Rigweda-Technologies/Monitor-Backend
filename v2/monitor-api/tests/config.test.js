import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig, resolveHrmsProfileUrl } from "../src/config/env.js";
import { buildPgPoolConfig } from "../src/database/prisma.js";

const baseEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/monitor_test",
  HRMS_BACKEND_URL: "http://localhost:8000/api/v1",
};

test("loadConfig requires explicit v2 database and HRMS targets", () => {
  assert.throws(() => loadConfig({ HRMS_BACKEND_URL: baseEnv.HRMS_BACKEND_URL }), /DATABASE_URL is required/);
  assert.throws(() => loadConfig({ DATABASE_URL: baseEnv.DATABASE_URL }), /HRMS_BACKEND_URL is required/);
  const config = loadConfig(baseEnv);
  assert.equal(config.port, 3002);
  assert.equal(config.apiBaseUrl, "http://localhost:3002");
  assert.equal(config.databasePoolMax, 5);
  assert.equal(config.databaseSslRejectUnauthorized, true);
});

test("loadConfig uses a configured public API URL in OpenAPI metadata", () => {
  const config = loadConfig({ ...baseEnv, PUBLIC_API_URL: "https://monitor.example.test/" });
  assert.equal(config.apiBaseUrl, "https://monitor.example.test");
  assert.throws(() => loadConfig({ ...baseEnv, PUBLIC_API_URL: "ftp://monitor.example.test" }), /PUBLIC_API_URL must use http: or https:/);
});

test("HRMS profile URL normalizes host, /api and /api/v1 base forms", () => {
  assert.equal(resolveHrmsProfileUrl("https://hrms.example.test"), "https://hrms.example.test/api/v1/users/me/profile");
  assert.equal(resolveHrmsProfileUrl("https://hrms.example.test/api"), "https://hrms.example.test/api/v1/users/me/profile");
  assert.equal(resolveHrmsProfileUrl("https://hrms.example.test/api/v1/"), "https://hrms.example.test/api/v1/users/me/profile");
});

test("Prisma PostgreSQL pool config removes ssl query parameters and retains secure TLS settings", () => {
  const config = loadConfig({
    ...baseEnv,
    DATABASE_URL: "postgresql://user:pass@db.example.test:5432/monitor_test?sslmode=require&sslrootcert=cert.pem",
  });
  const poolConfig = buildPgPoolConfig(config);
  const url = new URL(poolConfig.connectionString);
  assert.equal(url.searchParams.has("sslmode"), false);
  assert.equal(url.searchParams.has("sslrootcert"), false);
  assert.deepEqual(poolConfig.ssl, { rejectUnauthorized: true });
  assert.equal(poolConfig.max, 5);
  assert.equal(poolConfig.connectionTimeoutMillis, 10000);
});
