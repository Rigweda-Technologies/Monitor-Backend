const test = require("node:test");
const assert = require("node:assert/strict");
const { API_V1_PREFIX, API_V1_ROUTES, mountApiV1Routes } = require("../src/routes/apiV1");

test("all registered HRMS Express API mounts use the v1 prefix", () => {
  const registrations = [];
  let fcmRegistration;
  const app = { use: (path, router) => registrations.push({ path, router }) };

  mountApiV1Routes(
    app,
    {
      loadRouter: (modulePath) => ({ modulePath }),
      mountFcm: (app, prefix) => {
        fcmRegistration = { app, prefix };
      }
    }
  );

  assert.equal(registrations.length, API_V1_ROUTES.length);
  assert.ok(registrations.every(({ path }) => path.startsWith(`${API_V1_PREFIX}/`)));
  assert.equal(new Set(registrations.map(({ path }) => path)).size, API_V1_ROUTES.length);
  assert.ok(registrations.some(({ path }) => path === `${API_V1_PREFIX}/notifications`));
  assert.equal(fcmRegistration.prefix, API_V1_PREFIX);
  assert.equal(fcmRegistration.app, app);
});
