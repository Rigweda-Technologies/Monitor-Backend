import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { registerEmployeeRoutes } from '../src/modules/employees/employee.routes.js';

const leaveTypes = [
  { _id: 'leave-annual', name: 'Annual Leave', code: 'AL' },
  { _id: 'leave-sick', name: 'Sick Leave', code: 'SL' },
];

test('employee GET /leave-types preserves V1 status and response body with injected provider', async t => {
  const legacyApp = createLegacyRouterHarness({
    mounts: [{ path: '/api/v1/employees', modulePath: 'src/modules/employees/employee.routes.js' }],
    identity: { userId: 'parity-user', organizationId: 'parity-org' },
    overrides: {
      'src/modules/leaveTypes/leaveType.service.js': {
        getEmployeeleaves: async request => {
          assert.equal(request.user.organizationId, 'parity-org');
          return leaveTypes;
        },
      },
      'src/modules/organizations/organization.service.js': { isUserSuperAdmin: async () => false },
    },
  });
  const server = legacyApp.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const app = Fastify({ logger: false });
  await registerEmployeeRoutes(app, {
    service: { getEmployeeLeaves: async request => {
      assert.equal(request.user.organizationId, 'parity-org');
      return leaveTypes;
    } },
    authenticate: async request => { request.user = { userId: 'parity-user', organizationId: 'parity-org' }; },
    authorize: async () => null,
  });
  t.after(async () => {
    await app.close();
    await new Promise(resolve => server.close(resolve));
  });

  const legacyResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/employees/leave-types`);
  const v2Response = await app.inject({ method: 'GET', url: '/api/v2/employees/leave-types' });
  assert.equal(v2Response.statusCode, legacyResponse.status);
  assert.deepEqual(v2Response.json(), await legacyResponse.json());
});
