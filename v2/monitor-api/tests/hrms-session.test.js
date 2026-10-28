import test from "node:test";
import assert from "node:assert/strict";
import {
  createHrmsSessionVerifier,
} from "../src/integrations/hrms-session.js";
import { createAuthenticateRequest } from "../src/plugins/authentication.js";
import { HrmsUnavailableError, SessionRejectedError } from "../src/errors.js";

const token = "eyJhbGciOiJub25lIn0.eyJ1c2VySWQiOiJ1c2VyLTEiLCJvcmdhbml6YXRpb25JZCI6Im9yZy0xIn0.signature";

test("HRMS verifier resolves organization and employee from the active session profile", async () => {
  let requestUrl;
  const verifySession = createHrmsSessionVerifier({
    baseUrl: "https://hrms.example.test/api",
    fetchImpl: async (url, options) => {
      requestUrl = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { employeeId: "employee-1", organization: { timezone: "Asia/Kolkata" } },
        }),
      };
    },
  });

  const identity = await verifySession(token);

  assert.equal(requestUrl.url, "https://hrms.example.test/api/v1/users/me/profile");
  assert.equal(requestUrl.options.headers.Authorization, `Bearer ${token}`);
  assert.equal(identity.userId, "user-1");
  assert.equal(identity.organizationId, "org-1");
  assert.equal(identity.employeeId, "employee-1");
  assert.equal(identity.activityTimeZone, "Asia/Kolkata");
});

test("HRMS verifier falls back to the verified user ID when no employee profile is linked", async () => {
  const verifySession = createHrmsSessionVerifier({
    baseUrl: "https://hrms.example.test/api/v1",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { employeeId: null } }),
    }),
  });

  const identity = await verifySession(token);
  assert.equal(identity.employeeId, "user-1");
});

test("HRMS verifier rejects revoked sessions and password-change-required profiles", async () => {
  const revokedVerifier = createHrmsSessionVerifier({
    baseUrl: "https://hrms.example.test",
    fetchImpl: async () => ({ ok: false, status: 401 }),
  });
  await assert.rejects(revokedVerifier(token), SessionRejectedError);

  const passwordVerifier = createHrmsSessionVerifier({
    baseUrl: "https://hrms.example.test",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { mustChangePassword: true } }),
    }),
  });
  await assert.rejects(passwordVerifier(token), SessionRejectedError);
});

test("HRMS verifier distinguishes upstream outages from invalid sessions", async () => {
  const unavailableVerifier = createHrmsSessionVerifier({
    baseUrl: "https://hrms.example.test",
    fetchImpl: async () => ({ ok: false, status: 503 }),
  });
  await assert.rejects(unavailableVerifier(token), HrmsUnavailableError);

  let statusCode;
  const authenticate = createAuthenticateRequest({ verifySession: unavailableVerifier });
  const result = await authenticate(
    { headers: { authorization: `Bearer ${token}` } },
    { code(value) { statusCode = value; return this; }, send() {} },
  );
  assert.equal(statusCode, 503);
  assert.equal(result, undefined);
});
