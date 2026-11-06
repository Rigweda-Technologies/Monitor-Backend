import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { createModels } from '../src/modules/auth/auth.models.js';
import { createOrganizationService } from '../src/modules/organizations/organization.service.js';
import { registerOrganizationRoutes } from '../src/modules/organizations/organization.routes.js';
import { errorHandler } from '../src/plugins/errors.js';

const databaseBase = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const actorId = new mongoose.Types.ObjectId();
const organizationId = new mongoose.Types.ObjectId();
const sharedOrganizationId = new mongoose.Types.ObjectId();
const superRoleId = new mongoose.Types.ObjectId();
const regularRoleId = new mongoose.Types.ObjectId();
const soleUserId = new mongoose.Types.ObjectId();
const sharedUserId = new mongoose.Types.ObjectId();

const legacyModelsFor = connection => {
  const roleSchema = new mongoose.Schema({ slug:String }, { collection:'roles', autoCreate:false, autoIndex:false });
  const orgUserSchema = new mongoose.Schema({ userId:mongoose.Schema.Types.ObjectId, organizationId:mongoose.Schema.Types.ObjectId, roleIds:[{type:mongoose.Schema.Types.ObjectId,ref:'roles'}] }, { collection:'org_users', autoCreate:false, autoIndex:false });
  const organizationSchema = new mongoose.Schema({ name:String, code:String, status:String, isSoftDeleted:Boolean, softDeletedAt:Date, softDeletedBy:mongoose.Schema.Types.ObjectId }, { timestamps:true, collection:'organizations', autoCreate:false, autoIndex:false });
  const userSchema = new mongoose.Schema({ email:String, status:String, organizationIds:[mongoose.Schema.Types.ObjectId], activeOrganizationId:mongoose.Schema.Types.ObjectId, tokenList:[mongoose.Schema.Types.Mixed], softDeleteMeta:{organizationId:mongoose.Schema.Types.ObjectId,originalEmail:String,deletedAt:Date} }, { timestamps:true, collection:'users', autoCreate:false, autoIndex:false });
  return {
    Role:connection.model('roles',roleSchema,'roles'),
    OrgUser:connection.model('org_users',orgUserSchema,'org_users'),
    Organization:connection.model('organizations',organizationSchema,'organizations'),
    User:connection.model('users',userSchema,'users'),
  };
};

test('real V1/V2 organization soft-delete and restore preserve lifecycle responses and user state', { skip:!databaseBase }, async t => {
  const parsed = new URL(databaseBase);
  assert.ok(['localhost','127.0.0.1','::1'].includes(parsed.hostname));
  assert.match(parsed.pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const suffix = `${process.pid}_${randomBytes(5).toString('hex')}`;
  const uriFor = side => { const url = new URL(databaseBase); url.pathname = `/${url.pathname.slice(1)}_org_lifecycle_${side}_${suffix}`; return url.toString(); };
  const v1Connection = await mongoose.createConnection(uriFor('v1'),{autoCreate:false,autoIndex:false}).asPromise();
  const v2Connection = await mongoose.createConnection(uriFor('v2'),{autoCreate:false,autoIndex:false}).asPromise();
  t.after(async()=>{
    await Promise.all([v1Connection.dropDatabase().catch(()=>{}),v2Connection.dropDatabase().catch(()=>{})]);
    await Promise.all([v1Connection.close().catch(()=>{}),v2Connection.close().catch(()=>{})]);
  });
  const v1Models = legacyModelsFor(v1Connection);
  const v2AuthModels = createModels(v2Connection);
  const v2Models = { OrgUser:v2AuthModels.Membership, Organization:v2AuthModels.Organization, User:v2AuthModels.User, Role:v2AuthModels.Role };
  const identity = { userId:actorId.toString(), organizationId:organizationId.toString(), activeRoleId:superRoleId.toString(), roleKey:'superadmin' };
  const legacy = createLegacyRouterHarness({ identity, mounts:[{path:'/api/v1/organizations',modulePath:'src/modules/organizations/organization.routes.js'}], overrides:{
    'src/modules/organizations/organization.model.js':v1Models.Organization,
    'src/modules/organizations/org-user.model.js':v1Models.OrgUser,
    'src/modules/users/user.model.js':v1Models.User,
    'src/modules/roles/role.model.js':v1Models.Role,
    'src/modules/roles/role.seeder.js':{seedOrgRolesAndPermissions:async()=>{}},
    'src/modules/employees/employee.model.js':{ schema:{path:()=>null} },
    'src/modules/orgSettings/orgSettings.model.js':{},
  }});
  const v1Server = legacy.listen(0,'127.0.0.1');
  await new Promise((resolve,reject)=>{v1Server.once('listening',resolve);v1Server.once('error',reject);});
  const v2 = Fastify({logger:false});
  v2.setErrorHandler(errorHandler);
  const service = createOrganizationService({models:v2Models});
  await registerOrganizationRoutes(v2,{service,authenticate:async request=>{request.user=identity;},authorize:async()=>null});
  await v2.ready();
  t.after(async()=>{ await v2.close(); await new Promise(resolve=>v1Server.close(resolve)); });
  const seed = async models => {
    await models.Role.create([{_id:superRoleId,organizationId,name:'SuperAdmin',slug:'superadmin'},{_id:regularRoleId,organizationId,name:'Employee',slug:'employee'}]);
    await models.Organization.create([{_id:organizationId,name:'Lifecycle Org',code:'LIFECYCLE',timezone:'UTC',currency:'INR',status:'active'},{_id:sharedOrganizationId,name:'Shared Org',code:'SHARED',timezone:'UTC',currency:'INR',status:'active'}]);
    await models.User.create([
      {_id:actorId,email:`actor-${suffix}@example.test`,password:'synthetic',status:'active',organizationIds:[organizationId],activeOrganizationId:organizationId,tokenList:[]},
      {_id:soleUserId,email:`solo-${suffix}@example.test`,password:'synthetic',status:'active',organizationIds:[organizationId],activeOrganizationId:organizationId,tokenList:[{organizationId:organizationId.toString(),status:'active'}]},
      {_id:sharedUserId,email:`shared-${suffix}@example.test`,password:'synthetic',status:'active',organizationIds:[organizationId,sharedOrganizationId],activeOrganizationId:organizationId,tokenList:[{organizationId:organizationId.toString(),status:'active'},{organizationId:sharedOrganizationId.toString(),status:'active'}]},
    ]);
    await models.OrgUser.create([
      {userId:actorId,organizationId,roleIds:[superRoleId]},
      {userId:soleUserId,organizationId,roleIds:[regularRoleId]},
      {userId:sharedUserId,organizationId,roleIds:[regularRoleId]},
      {userId:sharedUserId,organizationId:sharedOrganizationId,roleIds:[regularRoleId]},
    ]);
  };
  await seed(v1Models); await seed(v2Models);
  const v1Base=`http://127.0.0.1:${v1Server.address().port}`;
  const invoke = async (side,action,confirmationCode='LIFECYCLE') => {
    if(side==='v1'){
      const response=await fetch(`${v1Base}/api/v1/organizations/${organizationId}/lifecycle`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,confirmationCode})});
      return {status:response.status,body:await response.json()};
    }
    const response=await v2.inject({method:'POST',url:`/api/v2/organizations/${organizationId}/lifecycle`,payload:{action,confirmationCode}});
    return {status:response.statusCode,body:response.json()};
  };
  const state = async models => {
    const [organization,sole,shared]=await Promise.all([
      models.Organization.findById(organizationId).lean(),
      models.User.findById(soleUserId).lean(),
      models.User.findById(sharedUserId).lean(),
    ]);
    return {
      organization:{status:organization.status,isSoftDeleted:organization.isSoftDeleted},
      sole:{email:sole.email.replace(/-\d+@/,'-<time>@'),status:sole.status,organizationIds:sole.organizationIds.map(String),activeOrganizationId:String(sole.activeOrganizationId||''),tokenCount:sole.tokenList.length,softDeleteOrganizationId:String(sole.softDeleteMeta?.organizationId||'')},
      shared:{email:shared.email,status:shared.status,organizationIds:shared.organizationIds.map(String),activeOrganizationId:String(shared.activeOrganizationId||''),tokenOrganizations:shared.tokenList.map(token=>String(token.organizationId))},
    };
  };
  const perform = async action => {
    const left=await invoke('v1',action); const right=await invoke('v2',action);
    assert.equal(left.status,right.status,`${action} status`);
    const normalize = response => JSON.parse(JSON.stringify(response,(_key,value)=>typeof value==='string'?value.replace(/-\d+@/g,'-<time>@'):value));
    assert.deepEqual(normalize(right.body),normalize(left.body),`${action} response`);
    assert.deepEqual(await state(v2Models),await state(v1Models),`${action} persisted state`);
  };
  await perform('soft_delete');
  await perform('restore');
  const beforeV1=await state(v1Models),beforeV2=await state(v2Models);
  const badV1=await invoke('v1','soft_delete','WRONG'),badV2=await invoke('v2','soft_delete','WRONG');
  assert.equal(badV1.status,400,JSON.stringify(badV1)); assert.equal(badV2.status,400,JSON.stringify(badV2));
  assert.deepEqual(badV2.body,badV1.body);
  assert.deepEqual(await state(v1Models),beforeV1);
  assert.deepEqual(await state(v2Models),beforeV2);
});
