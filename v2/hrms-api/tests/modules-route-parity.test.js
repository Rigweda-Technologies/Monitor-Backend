import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { registerEmployeeRoutes } from '../src/modules/employees/employee.routes.js';
import { registerDesignationRoutes } from '../src/modules/designations/designation.routes.js';
import { registerDepartmentRoutes } from '../src/modules/departments/department.routes.js';
import { registerExpenseRoutes } from '../src/modules/expenses/expense.routes.js';
import { registerProjectRoutes } from '../src/modules/projects/project.routes.js';
import { registerHiringRoutes } from '../src/modules/hiring/hiring.routes.js';

const denial = { code: 403, message: 'Access denied: active role not set' };
const routes = [
  { mount: 'employees', legacy: 'src/modules/employees/employee.routes.js', register: registerEmployeeRoutes, paths: [['POST','/'],['PUT','/me/profile'],['GET','/'],['GET','/export'],['GET','/next-code'],['GET','/leave-types'],['GET','/upcoming-events'],['GET','/me'],['PUT','/bulk-update'],['GET','/:id'],['PUT','/:id'],['PUT','/:id/lifecycle-action'],['PUT','/:id/reopen-profile'],['DELETE','/:id']] },
  { mount: 'designations', legacy: 'src/modules/designations/designation.routes.js', register: registerDesignationRoutes, paths: [['POST','/'],['PUT','/:id'],['DELETE','/:id'],['GET','/']] },
  { mount: 'departments', legacy: 'src/modules/departments/department.routes.js', register: registerDepartmentRoutes, paths: [['POST','/'],['PUT','/:id'],['DELETE','/:id'],['GET','/:id'],['GET','/']] },
  { mount: 'expenses', legacy: 'src/modules/expenses/expense.routes.js', register: registerExpenseRoutes, paths: [['POST','/'],['GET','/'],['GET','/summary'],['GET','/employees'],['POST','/upload-receipt'],['GET','/vendors'],['POST','/vendors'],['PUT','/vendors/:vendorId'],['DELETE','/vendors/:vendorId'],['PUT','/:id'],['DELETE','/:id'],['PUT','/:id/action'],['PUT','/:id/reimbursement'],['PUT','/:id/restore']] },
  { mount: 'projects', legacy: 'src/modules/projects/project.routes.js', register: registerProjectRoutes, paths: [['POST','/'],['GET','/'],['GET','/employees'],['GET','/:id'],['PUT','/:id'],['DELETE','/:id']] },
  { mount: 'hiring', legacy: 'src/modules/hiring/hiring.routes.js', register: registerHiringRoutes, paths: [['GET','/overview'],['GET','/employees'],['POST','/jobs'],['GET','/jobs'],['PUT','/jobs/:id'],['DELETE','/jobs/:id'],['POST','/candidates'],['GET','/candidates'],['PUT','/candidates/:id'],['PUT','/candidates/:id/stage'],['POST','/candidates/:id/release-offer-letter'],['POST','/candidates/:id/send-rejection-email'],['POST','/candidates/:id/convert-to-employee'],['POST','/candidates/:id/interviews'],['PUT','/candidates/:id/interviews/:interviewId/feedback'],['DELETE','/candidates/:id']] },
];

const service = new Proxy({}, { get: () => async () => null });
const params = path => path.replace(':id','507f1f77bcf86cd799439011').replace(':vendorId','507f1f77bcf86cd799439012').replace(':interviewId','507f1f77bcf86cd799439013');

test('all six module route registrations match V1 status and authorization failure envelope', async t => {
  let allow = false;
  const legacyApp = createLegacyRouterHarness({
    mounts: routes.map(({ mount, legacy }) => ({ path: `/api/v1/${mount}`, modulePath: legacy })),
    overrides: {
      'src/middlewares/authorize.middleware.js': () => (_req, res, next) => allow ? next() : res.status(denial.code).json({ success: false, code: denial.code, message: denial.message, data: null, error: null }),
      'src/modules/organizations/organization.service.js': { isUserSuperAdmin: async () => false },
    },
  });
  const legacyServer = legacyApp.listen(0, '127.0.0.1');
  await new Promise(resolve => legacyServer.once('listening', resolve));
  const v2 = Fastify({ logger: false, routerOptions: { ignoreTrailingSlash: true } });
  const authorize = async () => allow ? null : denial;
  const authenticate = async request => { request.user = { userId: 'parity-user', organizationId: 'parity-org' }; };
  for (const module of routes) await module.register(v2, { service, authenticate, authorize });
  t.after(async () => {
    await v2.close();
    await new Promise(resolve => legacyServer.close(resolve));
  });

  let checked = 0;
  for (const module of routes) for (const [method, template] of module.paths) {
    // V1's leave-types endpoint authenticates but has no permission middleware;
    // it calls the real leave provider, so it is outside this denial-only check.
    if (module.mount === 'employees' && template === '/leave-types') continue;
    const path = params(template);
    const legacyResponse = await fetch(`http://127.0.0.1:${legacyServer.address().port}/api/v1/${module.mount}${path}`, { method });
    const v2Response = await v2.inject({ method, url: `/api/v2/${module.mount}${path}` });
    assert.equal(v2Response.statusCode, legacyResponse.status, `${method} ${module.mount}${template}`);
    assert.deepEqual(v2Response.json(), await legacyResponse.json(), `${method} ${module.mount}${template}`);
    checked += 1;
  }
  assert.equal(checked, 58);
  allow = true;
  const invalidCreates = [
    ['employees', '/', {}],
    ['designations', '/', {}],
    ['departments', '/', {}],
    ['expenses', '/', {}],
    ['projects', '/', {}],
    ['hiring', '/jobs', {}],
  ];
  for (const [mount, path, payload] of invalidCreates) {
    const legacyResponse = await fetch(`http://127.0.0.1:${legacyServer.address().port}/api/v1/${mount}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const v2Response = await v2.inject({ method: 'POST', url: `/api/v2/${mount}${path}`, payload });
    assert.equal(v2Response.statusCode, legacyResponse.status, `${mount} create validation status`);
    assert.deepEqual(v2Response.json(), await legacyResponse.json(), `${mount} create validation body`);
  }
});
