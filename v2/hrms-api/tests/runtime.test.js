import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { buildApp } from '../src/app.js';
import { createRuntime } from '../src/runtime.js';
import { createOtpMailer } from '../src/integrations/otp-mailer.js';
import { loadConfig } from '../src/config/env.js';
import { createTokens } from '../src/integrations/tokens.js';
import { createAuthenticationHook } from '../src/plugins/authentication.js';
const config = () => loadConfig({MONGODB_URI:'mongodb://127.0.0.1/hrms_v2_test',JWT_SECRET:randomBytes(32).toString('hex')});
test('runtime closes owned connection exactly once and does not auto-create indexes',async()=>{
  const connection=mongoose.createConnection();
  let closes=0;
  connection.close=async()=>{closes++;};
  const runtime=await createRuntime({config:config(),connect:async()=>connection,logger:false});
  assert.ok(Object.values(connection.models).every(model=>model.schema.options.autoCreate===false&&model.schema.options.autoIndex===false));
  await runtime.close();
  assert.equal(closes,1);
});
test('mail adapter sets bounded timeouts, returns delivery status and closes transport',async()=>{
  let closed=false;
  const mailer=createOtpMailer({config:{host:'smtp.example.test',port:587,secure:false,user:'synthetic',pass:'synthetic',from:'sender@example.test'},timeoutMs:1234,createTransport:options=>{
    assert.equal(options.socketTimeout,1234);assert.equal(options.connectionTimeout,1234);assert.equal(options.greetingTimeout,1234);
    return {sendMail:async()=>{throw new Error('private details');},close:()=>{closed=true;}};
  }});
  assert.equal(await mailer.sendOtp({email:'synthetic@example.test',otp:'123456'}),false);
  mailer.close();assert.equal(closed,true);
});
test('tokens are unique within the same second and preserve legacy claims',()=>{
  const tokens=createTokens(config());
  const a=tokens.signToken({userId:'synthetic',organizationId:'org'}),b=tokens.signToken({userId:'synthetic',organizationId:'org'});
  assert.notEqual(a,b);assert.equal(tokens.verifyToken(a).userId,'synthetic');
});
test('public limiter retains v1 payload and CORS exposes token header',async t=>{
  const conf={...config(),publicLimit:1,corsOrigins:['https://example.test']};
  const app=await buildApp({config:conf,logger:false,authService:{sendOtp:async()=>{}},authenticate:async()=>{},isReady:async()=>{}});
  t.after(()=>app.close());
  const req={method:'POST',url:'/api/v2/users/send-otp',payload:{email:'synthetic@example.com'},headers:{origin:'https://example.test'}};
  const first=await app.inject(req);assert.equal(first.statusCode,200);assert.match(first.headers['access-control-expose-headers'],/Authorization/);
  const second=await app.inject(req);assert.equal(second.statusCode,429);assert.deepEqual(second.json(),{code:429,message:'Too many requests. Try again later.',data:null,error:null});
});
test('protected routes reject missing token before validation and enforce exact password-change allowlist',async t=>{
  const app=await buildApp({config:config(),logger:false,authService:{profile:async()=>({mustChangePassword:true})},authenticate:async()=>({mustChangePassword:true}),isReady:async()=>{}});
  t.after(()=>app.close());
  const missing=await app.inject({method:'POST',url:'/api/v2/users/switch-org',payload:{}});assert.equal(missing.statusCode,401);
  const restricted=await app.inject({method:'POST',url:'/api/v2/users/switch-org',payload:{},headers:{authorization:'Bearer synthetic'}});assert.equal(restricted.statusCode,403);assert.deepEqual(restricted.json().data,{mustChangePassword:true});
});
test('dependency failures never expose credentials through HTTP errors',async t=>{
  const app=await buildApp({config:config(),logger:false,authService:{sendOtp:async()=>{throw new Error('secret database connection');}},authenticate:async()=>{},isReady:async()=>{}});
  t.after(()=>app.close());
  const res=await app.inject({method:'POST',url:'/api/v2/users/send-otp',payload:{email:'synthetic@example.com'}});
  assert.equal(res.statusCode,500);assert.ok(!res.body.includes('secret'));
});
