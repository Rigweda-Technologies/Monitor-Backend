import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { validators } from '../src/modules/auth/auth.validation.js';
const require = createRequire(import.meta.url);
let legacy;
try { legacy = require('../../../hrms/back-end/src/modules/users/user.validator.js'); } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
const cases = [undefined,null,{},[],42,'value',{email:'bad'},{email:' SYNTHETIC@EXAMPLE.COM '},{email:'synthetic@example.com',password:'value'},{email:'synthetic@example.com',password:'value',unknown:true},{email:'synthetic@example.com',otp:'123456'},{email:'synthetic@example.com',otp:123456},{password:'abcdef',confirmPassword:'abcdef'},{password:'short',confirmPassword:'different'},{organizationId:'not-an-object-id'},{organizationId:'123',roleId:'ignored'},{email:'synthetic@example.com',password:'value',selfieImage:'a'.repeat(32),livenessSelfieImage:'b'.repeat(32)}];
for (const name of Object.keys(validators)) test(`v1/v2 validation parity: ${name}`,{skip:!legacy},()=>{
  for (const payload of cases) {
    const a=legacy[name].validate(payload??{}, {abortEarly:true});
    const b=validators[name].validate(payload??{}, {abortEarly:true});
    assert.equal(b.error?.message,a.error?.message,JSON.stringify(payload));
    if(!a.error) assert.deepEqual(b.value,a.value);
  }
});
