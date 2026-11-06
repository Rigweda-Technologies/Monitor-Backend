import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { createRuntime } from '../src/runtime.js';
import { createModels } from '../src/modules/auth/auth.models.js';
import bcrypt from 'bcryptjs';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const headers = token => ({ authorization: `Bearer ${token}` });
const request = (app, path, payload, token) => app.inject({ method: 'POST', url: `/api/v2/users/${path}`, payload, headers: token ? headers(token) : {} });
const secret = randomBytes(32).toString('hex');
const config = loadConfig({ MONGODB_URI: uri || 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: secret });

test('app factory health/readiness and safe internal errors do not need a database', async t => {
  const app = await buildApp({ config, logger: false, authService: {}, authenticate: async () => {}, isReady: async () => { throw new Error('private database details'); } });
  t.after(() => app.close());
  assert.equal((await app.inject('/api/v2/health')).statusCode, 200);
  const response = await app.inject('/api/v2/ready');
  assert.equal(response.statusCode, 503);
  assert.ok(!response.body.includes('private'));
});

test('complete auth HTTP contracts and persistence in isolated MongoDB', { skip: !uri }, async t => {
  const dbName = new URL(uri).pathname.slice(1);
  assert.match(dbName, /(^|[_-])(test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoIndex: false, autoCreate: false }).asPromise();
  const models = createModels(connection);
  const ids = Object.fromEntries(['user','org','role','employee','foreignOrg','foreignRole'].map(k => [k, new mongoose.Types.ObjectId()]));
  const email = `synthetic-${ids.user}@example.com`;
  const password = randomBytes(16).toString('hex');
  const newPassword = randomBytes(16).toString('hex');
  let deliveredOtp;
  const runtime = await createRuntime({ config, connection, logger: false, sendOtp: async ({ otp }) => { deliveredOtp = otp; }, verifySelfie: async () => ({ confidence: 99 }) });
  const app = runtime.app;
  t.after(async () => {
    for (const model of Object.values(models)) await model.deleteMany({ $or: [{ _id: { $in: Object.values(ids) } }, { userId: ids.user }, { organizationId: ids.org }] });
    await app.close();
    await connection.close();
  });
  await models.Organization.create({ _id: ids.org, name: 'Synthetic Org', code: String(ids.org), timezone: 'Asia/Kolkata', currency: 'INR' });
  await models.Role.create({ _id: ids.role, organizationId: ids.org, name: 'Employee', slug: 'employee', status: 'active' });
  await models.User.create({ _id: ids.user, email, password: await bcrypt.hash(password, 4), status: 'active', organizationIds: [ids.org] });
  await models.Membership.create({ userId: ids.user, organizationId: ids.org, roleIds: [ids.role] });
  await models.Employee.collection.insertOne({ _id: ids.employee, userId: ids.user, organizationId: ids.org, isDeleted: false, firstName: 'Synthetic', lastName: 'User', employeeCode: 'TEST-1', profileImage: 'https://example.test/photo.jpg' });
  let token;
  await t.test('login preserves Authorization header, envelope, organization and role fields', async () => {
    const response = await request(app, 'login', { email: email.toUpperCase(), password });
    assert.equal(response.statusCode, 200, response.body);
    token = response.headers.authorization;
    assert.ok(token);
    const body = response.json();
    assert.deepEqual(Object.keys(body).sort(), ['code','data','error','message','success']);
    assert.equal(body.message, 'Login successful');
    assert.equal(body.data.userId, String(ids.user));
    assert.equal(body.data.organization.name, 'Synthetic Org');
    assert.equal(body.data.roles[0].slug, 'employee');
    assert.equal(body.data.token, undefined);
    assert.equal(body.data.mustChangePassword, false);
    const user = await models.User.findById(ids.user).lean();
    assert.equal(user.tokenList[0].token, token);
  });
  await t.test('validation retains v1 406 response instead of Fastify 400', async () => {
    const res = await request(app, 'login', { email });
    assert.equal(res.statusCode, 406);
    assert.deepEqual(res.json(), { code: 406, message: 'Email and password are required', data: null, error: [] });
    const bad = await request(app, 'login', { email, password: 'wrong' });
    assert.equal(bad.statusCode, 400);
    assert.equal(bad.json().message, 'Invalid credentials');
  });
  await t.test('profile and permissions retain v1 fields and exclude secrets', async () => {
    const res = await app.inject({ url: '/api/v2/users/me/profile', headers: headers(token) });
    assert.equal(res.statusCode, 200, res.body);
    assert.deepEqual(res.json().data, { email, mustChangePassword: false, employeeId: String(ids.employee), firstName: 'Synthetic', lastName: 'User', employeeCode: 'TEST-1', managerId: null, profileImage: 'https://example.test/photo.jpg' });
    assert.deepEqual((await app.inject({ url: '/api/v2/users/me/permissions', headers: headers(token) })).json().data, []);
    assert.ok(!res.body.includes(password));
  });
  await t.test('cross-organization switch is denied and same-org switch issues stored session', async () => {
    assert.equal((await request(app, 'switch-org', { organizationId: String(ids.foreignOrg) }, token)).statusCode, 403);
    const res = await request(app, 'switch-org', { organizationId: String(ids.org) }, token);
    assert.equal(res.statusCode, 200, res.body);
    token = res.headers.authorization;
    assert.equal(res.json().data.organizationId, String(ids.org));
  });
  await t.test('selfie login preserves additional response fields', async () => {
    const res = await request(app, 'login/selfie', { email, password, selfieImage: 'a'.repeat(40), livenessSelfieImage: 'b'.repeat(40) });
    assert.equal(res.statusCode, 200, res.body);
    token = res.headers.authorization;
    assert.equal(res.json().data.faceMatchConfidence, 99);
    assert.equal(res.json().data.selfieVerificationBypassed, false);
    assert.equal(res.json().data.selfieVerificationBypassReason, null);
  });
  await t.test('generic OTP verification does not authorize password reset', async () => {
    assert.equal((await request(app, 'send-otp', { email })).statusCode, 200);
    assert.match(deliveredOtp, /^\d{6}$/);
    assert.equal((await request(app, 'verify-otp', { email, otp: deliveredOtp })).statusCode, 200);
    const res = await request(app, 'forgot-password/reset-password', { email, password: newPassword, confirmPassword: newPassword });
    assert.equal(res.statusCode, 400);
  });
  await t.test('forgot-password flow consumes grant once and keeps legacy session policy', async () => {
    await request(app, 'forgot-password/send-otp', { email });
    const otp = deliveredOtp;
    const verified = await Promise.all([1,2].map(() => request(app, 'forgot-password/verify-otp', { email, otp })));
    assert.deepEqual(verified.map(r => r.statusCode).sort(), [200,400]);
    const reset = await Promise.all([1,2].map(() => request(app, 'forgot-password/reset-password', { email, password: newPassword, confirmPassword: newPassword })));
    assert.deepEqual(reset.map(r => r.statusCode).sort(), [200,400]);
    const user = await models.User.findById(ids.user).select('+password').lean();
    assert.ok(await bcrypt.compare(newPassword, user.password));
    assert.equal(user.resetPasswordVerifiedUntil, null);
    assert.ok(user.tokenList.some(entry => entry.token === token));
  });
  await t.test('mandatory change-password routes derive email from session', async () => {
    await models.User.updateOne({ _id: ids.user }, { passwordChangeRequired: true });
    assert.equal((await request(app, 'switch-org', { organizationId: String(ids.org) }, token)).statusCode, 403);
    assert.equal((await request(app, 'change-password/send-otp', {}, token)).statusCode, 200);
    assert.equal((await request(app, 'change-password/verify-otp', { otp: deliveredOtp }, token)).statusCode, 200);
    const res = await request(app, 'change-password/update', { password, confirmPassword: password }, token);
    assert.equal(res.statusCode, 200, res.body);
    assert.equal((await models.User.findById(ids.user)).passwordChangeRequired, false);
  });
  await t.test('concurrent failed OTP attempts are bounded and never lost', async () => {
    await request(app, 'send-otp', { email });
    await Promise.all(Array.from({ length: 8 }, () => request(app, 'verify-otp', { email, otp: 'wrong!' })));
    assert.equal((await models.User.findById(ids.user)).otpAttempts, 5);
    assert.equal((await request(app, 'verify-otp', { email, otp: deliveredOtp })).statusCode, 429);
  });
  await t.test('concurrent logins preserve configured cap and unique stored tokens', async () => {
    await models.Settings.collection.insertOne({ organizationId: ids.org, maxActiveLoginsPerUser: 3 });
    const responses = await Promise.all(Array.from({length: 5}, () => request(app, 'login', {email,password})));
    assert.ok(responses.every(r => r.statusCode === 200), responses.map(r=>r.body).join('\n'));
    const stored = (await models.User.findById(ids.user).lean()).tokenList;
    assert.equal(stored.length, 3);
    assert.equal(new Set(stored.map(e=>e.token)).size, 3);
    assert.ok(stored.every(e => responses.some(r => r.headers.authorization === e.token)));
    token = stored[0].token;
  });
  await t.test('revoked session is rejected', async () => {
    await models.User.updateOne({ _id: ids.user }, { tokenList: [] });
    const res = await app.inject({ url: '/api/v2/users/me/profile', headers: headers(token) });
    assert.equal(res.statusCode, 401);
    assert.equal(res.json().message, 'Session expired. Please login again.');
  });
  await t.test('OpenAPI covers every registered application route', async () => {
    const spec = (await app.inject('/api/v2/docs/json')).json();
    assert.equal(Object.keys(spec.paths).length, 198);
    for (const route of app.applicationRoutes) {
      const openApiPath = route.url.replace(/:([^/]+)/g, '{$1}');
      const operation = spec.paths[openApiPath]?.[route.method.toLowerCase()];
      assert.ok(operation, `${route.method} ${route.url}`);
      assert.ok(operation.summary && operation.tags?.length && (operation.responses?.['200'] || operation.responses?.['201']));
      if (route.url.startsWith('/api/v2/users/')) {
        assert.ok(operation.responses['406']);
        assert.ok(Array.isArray(operation.security));
      }
    }
    assert.equal(app.applicationRoutes.filter(r => r.url.startsWith('/api/v2/users')).length, 15);
  });
});
