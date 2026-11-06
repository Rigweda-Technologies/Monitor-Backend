import test from 'node:test';
import assert from 'node:assert/strict';
import { createAttendanceFaceVerifier } from '../src/modules/timesheets/timesheet-face-verifier.js';

test('attendance face verifier applies configured threshold and sends images through the injected provider adapter', async () => {
  let call;
  const verify = createAttendanceFaceVerifier({ config: { apiKey: 'key', apiSecret: 'secret', compareUrl: 'https://face.invalid/compare', confidence: 70 }, fetchImpl: async (...args) => { call = args; return { json: async () => ({ confidence: 72 }) }; } });
  assert.deepEqual(await verify({ profileImageUrl: 'https://images.invalid/profile.jpg', selfieImage: 'data:image/jpeg;base64,Zm9v' }), { passed: true, confidence: 72 });
  assert.equal(call[0], 'https://face.invalid/compare');
  const form = new URLSearchParams(call[1].body);
  assert.equal(form.get('image_base64_2'), 'Zm9v');
  assert.equal(form.get('image_url1'), 'https://images.invalid/profile.jpg');
});

test('attendance face verifier reports missing configuration, invalid payload and bounded provider failures', async () => {
  const unconfigured = createAttendanceFaceVerifier({ config: {} });
  await assert.rejects(unconfigured({ profileImageUrl: 'url', selfieImage: 'abc' }), error => error.statusCode === 503);
  const configured = createAttendanceFaceVerifier({ config: { apiKey: 'key', apiSecret: 'secret', compareUrl: 'https://face.invalid', confidence: 70 }, timeoutMs: 5, fetchImpl: async () => { throw new Error('network'); } });
  await assert.rejects(configured({ profileImageUrl: 'url', selfieImage: '' }), error => error.statusCode === 400);
  await assert.rejects(configured({ profileImageUrl: 'url', selfieImage: 'abc' }), error => error.statusCode === 502);
});
