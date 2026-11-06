import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticateRequest } from '../src/middleware/auth.js';

const token = jwt.sign({ userId: 'employee', organizationId: 'org' }, 'synthetic-secret', { expiresIn: '1h' });
for (const [label, fetchResult, expected] of [
  ['active session', { ok: true, json: async () => ({ success: true, data: {} }) }, null],
  ['revoked session', { ok: false, status: 401 }, 401],
  ['disabled account', { ok: false, status: 403 }, 401],
  ['password change required', { ok: true, json: async () => ({ success: true, data: { mustChangePassword: true } }) }, 401],
]) test(label, async t => {
  t.mock.method(globalThis, 'fetch', async () => fetchResult);
  const req = { headers: { authorization: `Bearer ${token}` } };
  let status;
  await authenticateRequest(req, { code(value) { status = value; return this; }, send() {} });
  if (expected) { assert.equal(status, expected); assert.equal(req.auth, undefined); }
  else assert.equal(req.auth.organizationId, 'org');
});
test('HRMS outage fails closed', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('network failure'); });
  let status;
  const req = { headers: { authorization: `Bearer ${token}` } };
  await authenticateRequest(req, { code(value) { status = value; return this; }, send() {} });
  assert.equal(status, 503);
  assert.equal(req.auth, undefined);
});

test('session validation uses the configured HRMS API without duplicating the prefix', async t => {
  const previousUrl = process.env.HRMS_BACKEND_URL;
  process.env.HRMS_BACKEND_URL = 'http://localhost:8000/api';
  t.after(() => {
    if (previousUrl === undefined) delete process.env.HRMS_BACKEND_URL;
    else process.env.HRMS_BACKEND_URL = previousUrl;
  });

  let requestedUrl;
  t.mock.method(globalThis, 'fetch', async url => {
    requestedUrl = String(url);
    return { ok: true, json: async () => ({ success: true, data: {} }) };
  });

  const req = { headers: { authorization: `Bearer ${token}` } };
  await authenticateRequest(req, { code() { return this; }, send() {} });

  assert.equal(requestedUrl, 'http://localhost:8000/api/users/me/profile');
  assert.equal(req.auth.organizationId, 'org');
});

test('missing bearer token is rejected without contacting HRMS', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('fetch must not be called');
  });
  let status;
  let body;
  await authenticateRequest({ headers: {} }, {
    code(value) { status = value; return this; },
    send(value) { body = value; },
  });
  assert.equal(status, 401);
  assert.equal(body.message, 'Sign in to continue.');
  assert.equal(fetchMock.mock.callCount(), 0);
});
