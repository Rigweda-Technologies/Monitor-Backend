import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionService } from '../src/modules/auth/session.service.js';
import { createLoginService } from '../src/modules/auth/login.service.js';
import { createOtpService } from '../src/modules/auth/otp.service.js';
import { createSelfieService } from '../src/modules/auth/selfie.service.js';
import { httpError } from '../src/plugins/errors.js';
const user = { _id: 'user', email: 'user@example.com', status: 'active', tokenList: [{ token: 'synthetic-token', organizationId: 'org', status: 'active' }] };
const membership = { organizationId: { _id: 'org' }, roleIds: [{ _id: 'role', organizationId: 'org', status: 'active' }] };
const session = (overrides = {}, claims = { userId: 'user', organizationId: 'org', activeRoleId: 'role' }) => createSessionService({ repository: { userById: async () => user, membership: async () => membership, ...overrides }, verifyToken: () => claims });
test('both legacy ID claim forms resolve persisted session and current membership', async () => {
  assert.equal((await session().authenticate('synthetic-token')).userId, 'user');
  assert.equal((await session({}, { _id: 'user', organizationId: 'org', activeRoleId: 'role' }).authenticate('synthetic-token')).email, user.email);
});
for (const [name, overrides, code] of [
  ['missing user', {userById:async()=>null},401],
  ['inactive user', {userById:async()=>({...user,status:'inactive'})},403],
  ['revoked token', {userById:async()=>({...user,tokenList:[]})},401],
  ['inactive stored token', {userById:async()=>({...user,tokenList:[{token:'synthetic-token',status:'revoked'}]})},401],
  ['foreign token organization', {userById:async()=>({...user,tokenList:[{token:'synthetic-token',organizationId:'other'}]})},401],
  ['removed membership', {membership:async()=>null},403],
  ['removed role', {membership:async()=>({...membership,roleIds:[]})},403],
  ['foreign role', {membership:async()=>({...membership,roleIds:[{_id:'role',organizationId:'other'}]})},403],
  ['inactive role', {membership:async()=>({...membership,roleIds:[{_id:'role',organizationId:'org',status:'inactive'}]})},403],
]) test(`session denies ${name}`, async () => { await assert.rejects(session(overrides).authenticate('synthetic-token'), {statusCode:code}); });
test('signed privilege claims alone do not bypass persisted identity checks', async () => {
  await assert.rejects(session({userById:async()=>null},{roleKey:'superadmin',bypassMonitorDb:true}).authenticate('synthetic-token'),{statusCode:401});
});
const context = { user: { ...user, password: 'hash' }, membership, activeRole: membership.roleIds[0], employee: { profileImage: 'https://example.test/photo' } };
const loginDeps = (employee = {}, extra = {}) => ({
  config:{maxActiveLogins:1,tokenListLimit:10}, comparePassword:async()=>true, signToken:()=> 'new-token', now:()=>new Date('2026-11-01T10:00:00Z'),
  repository:{ userByEmail:async()=>context.user,memberships:async()=>[membership],employee:async()=>employee,settings:async()=>null,saveSession:async()=>{},...extra },
});
test('employment termination and completed notice reject login before session creation',async()=>{
  for(const employee of [{employmentLifecycleStatus:'terminated'},{employmentLifecycleStatus:'notice',noticeEndDate:new Date('2026-10-01')}]) await assert.rejects(createLoginService(loginDeps(employee)).login({email:user.email,password:'value'}),{statusCode:403});
});
test('login picks prior role, retains per-organization limit and leaves ownership to verified membership',async()=>{
  let saved;
  const deps=loginDeps({}, {settings:async()=>({maxActiveLoginsPerUser:3}),saveSession:async data=>{saved=data;}});
  const result=await createLoginService(deps).login({email:user.email,password:'value',organizationId:'attacker'});
  assert.equal(result.activeRole._id,'role');
  assert.equal(saved.organizationId,'org');
  assert.equal(saved.perOrgLimit,3);
  assert.equal(saved.globalLimit,10);
});
test('fallback employee role is assigned only in the login membership organization', async()=>{
  let assigned;
  const deps=loginDeps({}, {memberships:async()=>[{_id:'member',organizationId:{_id:'org'},roleIds:[]}],roleBySlug:async(org,slug)=>{assert.equal(org,'org');assert.equal(slug,'employee');return {_id:'fallback',name:'Employee',slug:'employee'};},addRole:async(...args)=>{assigned=args;}});
  const result=await createLoginService(deps).login({email:user.email,password:'value'});
  assert.deepEqual(assigned,['member','fallback']);
  assert.equal(result.activeRole._id,'fallback');
});
test('selfie outage fallback is opt-in and never accepts liveness rejection',async()=>{
  let issued=0;
  const loginService={resolve:async()=>context,finish:async()=>{issued++;return {token:'new-token'};}};
  const outage=()=>Promise.reject(httpError(502,'Face verification service is unreachable'));
  await assert.rejects(createSelfieService({loginService,verifySelfie:outage}).login({}),{statusCode:502});
  assert.equal(issued,0);
  const result=await createSelfieService({loginService,verifySelfie:outage,allowFallback:true}).login({});
  assert.equal(result.selfieVerificationBypassed,true);
  assert.equal(result.faceMatchConfidence,null);
  await assert.rejects(createSelfieService({loginService,verifySelfie:async()=>{throw httpError(401,'Liveness check failed');},allowFallback:true}).login({}),{statusCode:401});
  assert.equal(issued,1);
});
test('OTP expiry, attempt exhaustion and reused/current password preserve errors',async()=>{
  const now=()=>new Date('2026-11-01T10:00:00Z');
  let current={...user,otp:'123456',otpTimestamp:new Date('2026-11-01T09:49:59Z')};
  const service=createOtpService({repository:{userByEmail:async()=>current},now,comparePassword:async()=>true});
  await assert.rejects(service.verify({email:user.email,otp:'123456'}),{message:'OTP expired'});
  current={...current,otpAttempts:5};
  await assert.rejects(service.verify({email:user.email,otp:'123456'}),{statusCode:429});
  current={...user,resetPasswordVerifiedUntil:new Date('2026-11-01T10:05:00Z')};
  await assert.rejects(service.reset({email:user.email,password:'same',confirmPassword:'same'}),{message:'New password cannot be the same as current password'});
});
