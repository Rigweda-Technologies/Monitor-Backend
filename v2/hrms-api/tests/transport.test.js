import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
const config=loadConfig({MONGODB_URI:'mongodb://127.0.0.1/hrms_v2_test',JWT_SECRET:randomBytes(32).toString('hex')});
test('legacy form-encoded auth payloads and empty-body validation are preserved',async t=>{
  let email;
  const app=await buildApp({config,logger:false,authService:{sendOtp:async value=>{email=value;}},authenticate:async()=>{},isReady:async()=>{}});
  t.after(()=>app.close());
  const res=await app.inject({method:'POST',url:'/api/v2/users/send-otp',headers:{'content-type':'application/x-www-form-urlencoded'},payload:'email=SYNTHETIC%40example.com'});
  assert.equal(res.statusCode,200,res.body);assert.equal(email,'synthetic@example.com');
  const empty=await app.inject({method:'POST',url:'/api/v2/users/login'});
  assert.equal(empty.statusCode,406);
});
test('Swagger documents login token header and validation/limiting response contracts',async t=>{
  const app=await buildApp({config,logger:false,authService:{},authenticate:async()=>{},isReady:async()=>{}});t.after(()=>app.close());
  assert.equal((await app.inject('/api/v2/docs/')).statusCode, 200);
  const css = await app.inject('/api/v2/docs/static/swagger-ui.css');
  assert.equal(css.statusCode, 200);
  assert.match(css.headers['content-type'], /text\/css/);
  const spec=(await app.inject('/api/v2/docs/json')).json();
  assert.ok(spec.paths['/api/v2/users/login'].post.responses['200'].headers?.Authorization);
  assert.ok(spec.paths['/api/v2/users/login'].post.responses['429'].content['application/json'].schema.oneOf);
});
