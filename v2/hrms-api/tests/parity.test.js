import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createRuntime } from '../src/runtime.js';
import { createModels } from '../src/modules/auth/auth.models.js';
import { loadConfig } from '../src/config/env.js';
import { createLegacyHarness } from './helpers/legacy-harness.js';
const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const normalize = value => JSON.parse(JSON.stringify(value));

test('v1 and v2 return identical auth payloads/statuses across all 13 endpoints', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const config = loadConfig({ MONGODB_URI: uri, JWT_SECRET: randomBytes(32).toString('hex'), BCRYPT_SALT_ROUNDS: '4' });
  const conn = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const legacyUri = new URL(uri); legacyUri.pathname += '_legacy';
  const legacyConnection = await mongoose.createConnection(legacyUri.toString(), { autoCreate: false, autoIndex: false }).asPromise();
  const legacyModels = createModels(legacyConnection);
  let cleanup = async () => { await conn.close(); await legacyConnection.close(); };
  t.after(() => cleanup());
  const models = createModels(conn);
  const ids = Object.fromEntries(['user','org','role','employee'].map(key => [key, new mongoose.Types.ObjectId()]));
  const email = `parity-${ids.user}@example.com`;
  const password = randomBytes(12).toString('hex');
  let otpV1, otpV2;
  let faceCall = 0;
  const faceFetch = async url => ({ json: async () => {
    if (url.includes('compare')) return { confidence: 99 };
    const open = faceCall++ % 2 === 0;
    const side = { no_glass_eye_open: open ? 90 : 1, no_glass_eye_close: open ? 1 : 90 };
    return { faces: [{ attributes: { eyestatus: { left_eye_status: side, right_eye_status: side } } }] };
  } });
  const legacy = createLegacyHarness({ models: legacyModels, config, faceFetch, sendMail: async (_template,_name,_subject,otp) => { otpV1=otp; return true; } });
  const server = legacy.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const runtime = await createRuntime({ config, connection: conn, logger: false, sendOtp: async ({otp}) => { otpV2=otp; }, verifySelfie: async () => ({ confidence: 99 }) });
  cleanup = async () => {
    await runtime.close();
    await new Promise(resolve => server.close(resolve));
    for (const model of [...Object.values(models), ...Object.values(legacyModels)]) await model.deleteMany({ $or: [{ _id: { $in: Object.values(ids) } }, { userId: ids.user }, { organizationId: ids.org }] });
    await conn.close();
    await legacyConnection.close();
  };
  const hash = await bcrypt.hash(password, 4);
  const fixtureDate = new Date('2026-11-01T00:00:00Z');
  for (const fixtureModels of [legacyModels, models]) {
    // Insert pre-default document shapes directly to expose Mongoose hydration parity.
    await fixtureModels.Organization.collection.insertOne({ _id: ids.org, name: 'Parity Org', code: String(ids.org), timezone: 'Asia/Kolkata', currency: 'INR', createdAt: fixtureDate, updatedAt: fixtureDate });
    await fixtureModels.Role.collection.insertOne({ _id: ids.role, organizationId: ids.org, name: 'Employee', slug: 'employee', createdAt: fixtureDate, updatedAt: fixtureDate });
    await fixtureModels.Membership.collection.insertOne({ userId: ids.user, organizationId: ids.org, roleIds: [ids.role], createdAt: fixtureDate, updatedAt: fixtureDate });
    await fixtureModels.Employee.collection.insertOne({ _id: ids.employee, organizationId: ids.org, userId: ids.user, firstName: 'Parity', isDeleted: false, profileImage: 'https://example.test/image' });
    await fixtureModels.User.collection.insertOne({ _id: ids.user, email, password: hash, organizationIds: [ids.org], createdAt: fixtureDate, updatedAt: fixtureDate });
  }
  let tokenV1, tokenV2;
  const call = async (version, path, body, token) => {
    const method = path.startsWith('me/') ? 'GET' : 'POST';
    const headers = { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}) };
    if (version === 1) {
      const res = await fetch(`${base}/api/v1/users/${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: res.status, body: await res.json(), token: res.headers.get('authorization') };
    }
    const res = await runtime.app.inject({ method, url: `/api/v2/users/${path}`, headers, payload: body });
    return { status: res.statusCode, body: res.json(), token: res.headers.authorization };
  };
  const compare = async (path, body, { before, body2 } = {}) => {
    if (before) await before(legacyModels);
    const a = await call(1,path,body,tokenV1);
    if (before) await before(models);
    // Each implementation writes its own isolated fixture database.
    const b = await call(2,path,body2 || body,tokenV2);
    assert.equal(b.status, a.status, `${path}: ${JSON.stringify({a,b})}`);
    assert.deepEqual(normalize(b.body), normalize(a.body), path);
    assert.equal(Boolean(b.token), Boolean(a.token), `${path} Authorization header`);
    if(a.token) tokenV1=a.token;
    if(b.token) tokenV2=b.token;
  };
  await compare('login', {email,password});
  await compare('login', {email});
  await compare('login', {email,password:'incorrect'});
  await compare('login', {email,password,extra:true});
  await compare('me/profile');
  await compare('me/permissions');
  await compare('switch-org', {organizationId:String(ids.org)});
  await compare('login/selfie', {email,password,selfieImage:'a'.repeat(40),livenessSelfieImage:'b'.repeat(40)});
  await compare('send-otp', {email});
  const setOtp = async models => models.User.updateOne({_id:ids.user}, {otp:'123456',otpTimestamp:new Date(),otpAttempts:0});
  await compare('verify-otp', {email,otp:'123456'}, {before:setOtp});
  await compare('forgot-password/send-otp', {email});
  await compare('forgot-password/verify-otp', {email,otp:'123456'}, {before:setOtp});
  const resetGrant = async models => models.User.updateOne({_id:ids.user}, {password:hash,resetPasswordVerifiedAt:new Date(),resetPasswordVerifiedUntil:new Date(Date.now()+600000)});
  await compare('forgot-password/reset-password', {email,password:'replacement-password',confirmPassword:'replacement-password'}, {before:resetGrant});
  await compare('change-password/send-otp', {});
  await compare('change-password/verify-otp', {otp:'123456'}, {before:setOtp});
  await compare('change-password/update', {password:'replacement-password',confirmPassword:'replacement-password'}, {before:resetGrant});
  assert.match(otpV1,/^\d{6}$/);
  assert.match(otpV2,/^\d{6}$/);
  await compare('verify-otp', {email,otp:'000000'});
  const setExpiredOtp = async models => models.User.updateOne({_id:ids.user}, {otp:'123456',otpTimestamp:new Date(Date.now()-600001),otpAttempts:0});
  await compare('verify-otp', {email,otp:'123456'}, {before:setExpiredOtp});
  const setOtpAttemptLimit = async models => models.User.updateOne({_id:ids.user}, {otp:'123456',otpTimestamp:new Date(),otpAttempts:5});
  await compare('verify-otp', {email,otp:'123456'}, {before:setOtpAttemptLimit});
  await compare('forgot-password/reset-password', {email,password:'short',confirmPassword:'different'});
});
