import test from "node:test";
import assert from "node:assert/strict";
import { buildHrmsApiUrl } from "../src/integrations/hrmsApiUrl.js";

test("buildHrmsApiUrl adds v1 when configured with an /api base", () => {
  const original = process.env.HRMS_BACKEND_URL;
  process.env.HRMS_BACKEND_URL = "https://hrms.example.test/api";

  try {
    assert.equal(
      buildHrmsApiUrl("/users/me/profile"),
      "https://hrms.example.test/api/v1/users/me/profile"
    );
  } finally {
    if (original === undefined) delete process.env.HRMS_BACKEND_URL;
    else process.env.HRMS_BACKEND_URL = original;
  }
});

test("buildHrmsApiUrl does not duplicate a configured /api/v1 base", () => {
  const original = process.env.HRMS_BACKEND_URL;
  process.env.HRMS_BACKEND_URL = "https://hrms.example.test/api/v1/";

  try {
    assert.equal(
      buildHrmsApiUrl("/api/v1/employees/me"),
      "https://hrms.example.test/api/v1/employees/me"
    );
  } finally {
    if (original === undefined) delete process.env.HRMS_BACKEND_URL;
    else process.env.HRMS_BACKEND_URL = original;
  }
});
