import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createRuntime } from '../src/runtime.js';
import { loadConfig } from '../src/config/env.js';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const normalize = value => JSON.parse(JSON.stringify(value));
const comparable = value => {
  const copy = structuredClone(value);
  const strip = item => {
    if (Array.isArray(item)) return item.map(strip);
    if (!item || typeof item !== 'object') return item;
    const result = { ...item };
    delete result._id;
    delete result.createdAt;
    delete result.updatedAt;
    for (const [key, child] of Object.entries(result)) result[key] = strip(child);
    return result;
  };
  copy.data = strip(copy.data);
  return copy;
};

test('department V1 and V2 routes return the same statuses and envelopes for CRUD and validation', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const legacyUri = new URL(uri);
  legacyUri.pathname += '_departments_legacy';
  const config = loadConfig({ MONGODB_URI: uri, JWT_SECRET: randomBytes(32).toString('hex') });
  const v2Connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const legacyConnection = await mongoose.createConnection(legacyUri.toString(), { autoCreate: false, autoIndex: false }).asPromise();
  let runtime;
  let legacyServer;
  const identity = { userId: new mongoose.Types.ObjectId().toString(), _id: new mongoose.Types.ObjectId().toString(), organizationId: new mongoose.Types.ObjectId().toString() };
  const roleId = new mongoose.Types.ObjectId();
  const token = jwt.sign({ userId: identity.userId, organizationId: identity.organizationId, roleIds: [String(roleId)], activeRoleId: String(roleId) }, config.jwtSecret, { expiresIn: '1h' });
  t.after(async () => {
    await runtime?.close();
    if (legacyServer) await new Promise(resolve => legacyServer.close(resolve));
    await v2Connection.close();
    await legacyConnection.close();
  });

  const DepartmentSchema = new mongoose.Schema({ organizationId: { type: mongoose.Schema.Types.ObjectId, required: true }, name: { type: String, required: true, trim: true }, code: { type: String, required: true, uppercase: true, trim: true }, managerId: mongoose.Schema.Types.ObjectId, status: { type: String, enum: ['active','inactive'], default: 'active' }, isDeleted: { type: Boolean, default: false }, deletedAt: Date, deletedBy: mongoose.Schema.Types.ObjectId }, { timestamps: true });
  DepartmentSchema.pre(/^find/, function () { this.where({ isDeleted: false }); });
  const v1Department = legacyConnection.model('departments', DepartmentSchema, 'departments');
  const v1Employee = legacyConnection.model('employees', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }, { collection: 'employees' }));
  const v1Audit = legacyConnection.model('audit_logs', new mongoose.Schema({}, { strict: false, collection: 'audit_logs' }));
  const legacyApp = createLegacyRouterHarness({
    mounts: [{ path: '/api/v1/departments', modulePath: 'src/modules/departments/department.routes.js' }],
    identity: { userId: identity.userId, organizationId: identity.organizationId },
    overrides: {
      'src/modules/departments/department.model.js': v1Department,
      'src/modules/employees/employee.model.js': v1Employee,
      'src/modules/auditLogs/auditLogs.model.js': v1Audit,
      'src/modules/auditLogs/auditLogs.service.js': { audit: async ({ req, ...entry }) => v1Audit.create({ organizationId: req.user.organizationId, userId: req.user.userId, ...entry }) },
      'src/modules/organizations/organization.service.js': { isUserSuperAdmin: async () => false },
    },
  });
  legacyServer = legacyApp.listen(0, '127.0.0.1');
  await new Promise(resolve => legacyServer.once('listening', resolve));
  runtime = await createRuntime({ config, connection: v2Connection, logger: false });
  const runtimeUser = runtime.departmentModels.Department.db.model('users');
  const runtimeRole = runtime.departmentModels.Role;
  const runtimeOrganization = runtime.departmentModels.Department.db.model('organizations');
  const organizationId = new mongoose.Types.ObjectId(identity.organizationId);
  const userId = new mongoose.Types.ObjectId(identity.userId);
  await runtimeRole.collection.insertOne({ _id: roleId, organizationId, name: 'Super Admin', slug: 'superadmin', isSystemRole: true });
  await runtimeOrganization.collection.insertOne({ _id: organizationId, name: 'Parity Org', code: `P${organizationId.toString().slice(-5)}` });
  await runtimeUser.collection.insertOne({ _id: userId, email: `parity-${userId}@example.test`, password: 'synthetic', status: 'active', tokenList: [{ token, organizationId, status: 'active' }] });
  await runtime.departmentModels.Department.db.collection('org_users').insertOne({ userId, organizationId, roleIds: [roleId] });

  const legacyServerOrigin = `http://127.0.0.1:${legacyServer.address().port}`;
  const calls = async (method, path, body, v2Path = path) => {
    const headers = { ...(body === undefined ? {} : { 'content-type': 'application/json' }) };
    const v1Response = await fetch(`${legacyServerOrigin}/api/v1/departments${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const v2Response = await runtime.app.inject({ method, url: `/api/v2/departments${v2Path}`, headers: { ...headers, authorization: `Bearer ${token}` }, payload: body });
    return [{ status: v1Response.status, body: normalize(await v1Response.json()) }, { status: v2Response.statusCode, body: normalize(v2Response.json()) }];
  };
  const [v1Create, v2Create] = await calls('POST', '/', { name: 'Parity Department', code: 'PARITY' });
  assert.equal(v2Create.status, v1Create.status, JSON.stringify({v1Create,v2Create}));
  assert.deepEqual(comparable(v2Create.body), comparable(v1Create.body));
  const legacyDepartmentId = v1Create.body.data._id;
  const v2DepartmentId = v2Create.body.data._id;
  for (const [method, path, body] of [
    ['GET', `/${legacyDepartmentId}`, undefined],
    ['PUT', `/${legacyDepartmentId}`, { name: 'Parity Updated', status: 'inactive' }],
    ['GET', `/${legacyDepartmentId}`, undefined],
    ['GET', '/', undefined],
    ['DELETE', `/${legacyDepartmentId}`, undefined],
  ]) {
    const v2Path = path.replace(legacyDepartmentId, v2DepartmentId);
    const [left, right] = await calls(method, path, body, v2Path);
    assert.equal(right.status, left.status, `${method} ${path}`);
    assert.deepEqual(comparable(right.body), comparable(left.body), `${method} ${path}`);
  }
  const [v1Invalid, v2Invalid] = await calls('POST', '/', { name: 'Bad 1', code: 'BAD!' });
  assert.equal(v2Invalid.status, v1Invalid.status);
  assert.deepEqual(v2Invalid.body, v1Invalid.body);
});
