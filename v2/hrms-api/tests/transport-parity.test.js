import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createLegacyHarness } from './helpers/legacy-harness.js';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
const config=loadConfig({MONGODB_URI:'mongodb://127.0.0.1/hrms_v2_test',JWT_SECRET:randomBytes(32).toString('hex')});
const models={};
test('malformed JSON transport error preserves the v1 status and response',async t=>{
 const legacy=createLegacyHarness({models,config,sendMail:async()=>true,faceFetch:async()=>({json:async()=>({})})});
 const server=legacy.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const app=await buildApp({config,logger:false,authService:{},authenticate:async()=>{},isReady:async()=>{}});
 t.after(async()=>{await app.close();await new Promise(resolve=>server.close(resolve));});
 const res=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/users/login`,{method:'POST',headers:{'content-type':'application/json'},body:'{'});
 const expected={status:res.status,body:await res.json()};
 const actual=await app.inject({method:'POST',url:'/api/v2/users/login',headers:{'content-type':'application/json'},payload:'{'});
 assert.equal(expected.status,400);
 assert.equal(actual.statusCode,expected.status);
 assert.deepEqual(actual.json(),expected.body);
});
test('empty JSON body uses the same 406 validation response as v1',async t=>{
 const app=await buildApp({config,logger:false,authService:{},authenticate:async()=>{},isReady:async()=>{}});t.after(()=>app.close());
 const actual=await app.inject({method:'POST',url:'/api/v2/users/login',headers:{'content-type':'application/json','content-length':'0'},payload:''});
 assert.equal(actual.statusCode,406);
 assert.deepEqual(actual.json(),{code:406,message:'Email and password are required',data:null,error:[]});
});
