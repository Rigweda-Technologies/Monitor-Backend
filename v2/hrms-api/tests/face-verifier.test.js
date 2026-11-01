import test from 'node:test';
import assert from 'node:assert/strict';
import { createFaceVerifier } from '../src/integrations/face-verifier.js';
const config = { apiKey: 'synthetic-key', apiSecret: 'synthetic-secret', detectUrl: 'https://example.test/detect', compareUrl: 'https://example.test/compare', confidence: 70 };
const input = { profileImageUrl: 'https://example.test/profile', selfieImage: 'a'.repeat(32), livenessSelfieImage: 'b'.repeat(32) };
const eyes = (open, closed) => ({ faces: [{ attributes: { eyestatus: { left_eye_status: { no_glass_eye_open: open, no_glass_eye_close: closed }, right_eye_status: { no_glass_eye_open: open, no_glass_eye_close: closed } } } }] });
const provider = replies => async (_url, options) => { assert.ok(options.signal); return { ok: true, json: async () => replies.shift() }; };
test('face provider requires open eyes, closed eyes, then matching confidence', async () => {
  const verify = createFaceVerifier({ config, timeoutMs: 100, fetchImpl: provider([eyes(90, 1), eyes(1, 90), { confidence: 91 }]) });
  assert.deepEqual(await verify(input), { confidence: 91 });
});
test('liveness and low match return 401 and cannot enable outage fallback', async () => {
  await assert.rejects(createFaceVerifier({ config, timeoutMs: 100, fetchImpl: provider([eyes(1,90)]) })(input), { statusCode: 401 });
  await assert.rejects(createFaceVerifier({ config, timeoutMs: 100, fetchImpl: provider([eyes(90,1),eyes(1,90),{confidence: 20}]) })(input), { statusCode: 401 });
});
test('provider timeout is bounded and missing config fails without requesting', async () => {
  const verify = createFaceVerifier({ config, timeoutMs: 20, fetchImpl: async () => { throw new Error('private provider details'); } });
  await assert.rejects(verify(input), e => e.statusCode === 502 && !e.message.includes('private'));
  await assert.rejects(createFaceVerifier({ config: {}, timeoutMs: 20 })(input), { statusCode: 503 });
});

test('malformed data URLs return the v1 payload error without provider calls',async()=>{
  let calls=0;
  const verify=createFaceVerifier({config,timeoutMs:100,fetchImpl:async()=>{calls++;return {ok:true,json:async()=>eyes(90,1)}}});
  await assert.rejects(verify({...input,selfieImage:`data:${'a'.repeat(40)}`}),{statusCode:400,message:'Invalid selfie image payload'});
  assert.equal(calls,0);
  await assert.rejects(verify({...input,livenessSelfieImage:'data:,'}),{statusCode:400,message:'Invalid selfie image payload'});
  assert.equal(calls,0);
});
