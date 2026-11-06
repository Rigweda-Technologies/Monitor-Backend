import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import mongoose from 'mongoose';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { registerRoleRoutes } from '../src/modules/roles/role.routes.js';
import { registerPermissionRoutes } from '../src/modules/permissions/permission.routes.js';
import { createAuthRepository } from '../src/modules/auth/auth.repository.js';
import { createRoleService } from '../src/modules/roles/role.service.js';
import { createTokens } from '../src/integrations/tokens.js';
import { errorHandler } from '../src/plugins/errors.js';

const legacyRequire=createRequire(new URL('../../../hrms/back-end/package.json',import.meta.url));
const organizationId='507f1f77bcf86cd799439011',userId='507f1f77bcf86cd799439012',permissionId='507f1f77bcf86cd799439013',adminRoleId='507f1f77bcf86cd799439014',employeeRoleId='507f1f77bcf86cd799439015',customRoleId='507f1f77bcf86cd799439016';
const identity={userId,email:'roles@example.test',organizationId,activeOrganizationId:organizationId,activeRoleId:'507f1f77bcf86cd799439099',roleIds:[adminRoleId],roleKey:'superadmin'};
const normalize=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='_id'&&item?'<id>':key==='token'&&item?'<token>':['createdAt','updatedAt','loginTimestamp','lastLoginAt'].includes(key)&&item?'<timestamp>':item));
const parseLegacy=async response=>({status:response.status,headers:response.headers,body:JSON.parse(await response.text())});
const parseV2=response=>({status:response.statusCode,headers:response.headers,body:response.json()});
const compare=async(a,b)=>{
  assert.equal(a.status,b.status);
  const header=(headers,name)=>typeof headers?.get==='function'?headers.get(name):headers?.[name];
  assert.equal(header(a.headers,'content-type')?.split(';')[0],header(b.headers,'content-type')?.split(';')[0]);
  assert.equal(header(a.headers,'authorization')?.replace(/Bearer .+/, 'Bearer <token>')??null,header(b.headers,'authorization')?.replace(/Bearer .+/, 'Bearer <token>')??null);
  assert.deepEqual(normalize(a.body),normalize(b.body));
};

test('direct V1/V2 role and permission HTTP contracts match against an isolated localhost Mongo fixture',async t=>{
  const suffix=randomBytes(6).toString('hex'),dbName=`hrms_roles_parity_${process.pid}_${suffix}`,uri=`mongodb://127.0.0.1:27017/${dbName}`;
  const connection=await mongoose.createConnection(uri,{serverSelectionTimeoutMS:1800,autoIndex:false,autoCreate:false}).asPromise().catch(()=>null);
  if(!connection){t.skip('isolated localhost MongoDB is unavailable');return;}
  const legacyMongoose=legacyRequire('mongoose');await legacyMongoose.connect(uri,{serverSelectionTimeoutMS:1800,autoIndex:false,autoCreate:false});
  t.after(async()=>{await connection.dropDatabase();await connection.close();await legacyMongoose.disconnect();});
  const secret=`roles-parity-${randomBytes(12).toString('hex')}`,oldSecret=process.env.JWT_SECRET,oldExpiry=process.env.JWT_EXPIRES_IN,oldTokenLimit=process.env.TOKEN_LIST_LIMIT;
  process.env.JWT_SECRET=secret;process.env.JWT_EXPIRES_IN='1d';process.env.TOKEN_LIST_LIMIT='5';
  t.after(()=>{for(const [name,value] of [['JWT_SECRET',oldSecret],['JWT_EXPIRES_IN',oldExpiry],['TOKEN_LIST_LIMIT',oldTokenLimit]])if(value===undefined)delete process.env[name];else process.env[name]=value;});
  const v1Models={
    User:legacyRequire('./src/modules/users/user.model.js'),Organization:legacyRequire('./src/modules/organizations/organization.model.js'),
    Role:legacyRequire('./src/modules/roles/role.model.js'),Permission:legacyRequire('./src/modules/permissions/permission.model.js'),
    OrgSettings:legacyRequire('./src/modules/orgSettings/orgSettings.model.js'),
  };
  await v1Models.Organization.create({_id:organizationId,name:'Parity Org',code:'PARITY',timezone:'UTC',currency:'INR'});
  await v1Models.Permission.create({_id:permissionId,organizationId,name:'View',code:'EMP_VIEW',module:'employees'});
  await v1Models.Role.create({_id:employeeRoleId,organizationId,name:'Employee',slug:'employee',permissionIds:[permissionId],status:'inactive'});
  await v1Models.Role.create({_id:adminRoleId,organizationId,name:'Org Admin',slug:'org-admin',permissionIds:[permissionId],isSystemRole:true,status:'active'});
  await v1Models.User.collection.insertOne({_id:new legacyMongoose.Types.ObjectId(userId),email:identity.email,password:'unused',status:'active',organizationIds:[new legacyMongoose.Types.ObjectId(organizationId)],activeOrganizationId:new legacyMongoose.Types.ObjectId(organizationId),tokenList:[]});
  await v1Models.OrgSettings.create({organizationId,maxActiveLoginsPerUser:1});
  const legacy=createLegacyRouterHarness({identity,environment:{JWT_SECRET:secret,JWT_EXPIRES_IN:'1d',TOKEN_LIST_LIMIT:'5'},overrides:{
    'src/middlewares/authorize.middleware.js':()=> (req,res,next)=>req.headers['x-test-deny']?res.status(403).json({success:false,code:403,message:'Permission denied',data:null,error:null}):next(),
    'src/modules/users/user.model.js':v1Models.User,'src/modules/organizations/organization.model.js':v1Models.Organization,
    'src/modules/roles/role.model.js':v1Models.Role,'src/modules/permissions/permission.model.js':v1Models.Permission,
    'src/modules/orgSettings/orgSettings.model.js':v1Models.OrgSettings,
    'src/modules/organizations/organization.service.js':{getOrganizationById:id=>v1Models.Organization.findById(id)},
  },mounts:[
    {path:'/api/v1/roles',modulePath:'src/modules/roles/role.routes.js'},
    {path:'/api/v1/permissions',modulePath:'src/modules/permissions/permission.routes.js'},
  ]});
  const server=createServer(legacy);await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const url=`http://127.0.0.1:${server.address().port}`;

  const repository=createAuthRepository({connection}),{signToken}=createTokens({jwtSecret:secret,jwtExpiresIn:'1d'});
  const v2Service=createRoleService({repository,signToken,config:{maxActiveLogins:1,tokenListLimit:5}});
  const permissions={listPermissions:organization=>repository.permissionsByOrganization(organization)};
  const app=Fastify({logger:false});app.setErrorHandler(errorHandler);
  const authorize=async(_permission,request)=>request.headers['x-test-deny']?{code:403,message:'Permission denied'}:null;
  const v2Identity={...identity,userId:new mongoose.Types.ObjectId(userId),organizationId:new mongoose.Types.ObjectId(organizationId)};
  await registerRoleRoutes(app,{service:v2Service,authenticate:async request=>{request.user=v2Identity;},authorize});
  await registerPermissionRoutes(app,{service:permissions,authenticate:async request=>{request.user=v2Identity;},authorize});
  await app.ready();t.after(()=>app.close());

  const sendPair=async(method,pathV1,pathV2,payload,beforeV2=async()=>{})=>{
    const legacyResponse=await parseLegacy(await fetch(`${url}${pathV1}`,{method,headers:{'content-type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})}));
    await beforeV2();
    const v2Response=parseV2(await app.inject({method,url:pathV2,...(payload?{payload}:{})}));
    await compare(legacyResponse,v2Response);return {legacyResponse,v2Response};
  };
  const created=await sendPair('POST','/api/v1/roles/','/api/v2/roles/',{name:'Auditor',slug:'auditor',permissionIds:[permissionId]},()=>v1Models.Role.deleteMany({organizationId,slug:'auditor'}));
  const custom=await v1Models.Role.create({_id:customRoleId,organizationId,name:'Auditor',slug:'auditor',permissionIds:[permissionId],status:'active'});
  const updated=await sendPair('PUT',`/api/v1/roles/${customRoleId}`,`/api/v2/roles/${customRoleId}`,{name:'Auditor Updated',status:'inactive'});
  await v1Models.Role.updateOne({_id:customRoleId},{$set:{name:'Auditor',status:'active'}});
  await sendPair('DELETE',`/api/v1/roles/${customRoleId}`,`/api/v2/roles/${customRoleId}`);
  await v1Models.Role.updateOne({_id:customRoleId},{$set:{status:'active'}});
  await sendPair('GET','/api/v1/roles/','/api/v2/roles/');
  await sendPair('GET',`/api/v1/roles/${customRoleId}`,`/api/v2/roles/${customRoleId}`);
  const switched=await sendPair('POST','/api/v1/roles/switch','/api/v2/roles/switch',{roleId:adminRoleId});
  await sendPair('GET','/api/v1/permissions/','/api/v2/permissions/');
  assert.equal(created.legacyResponse.status,201);assert.equal(updated.legacyResponse.status,200);assert.ok(custom);
  assert.match(switched.legacyResponse.headers.get('authorization')||'', /^Bearer /);

  for(const [pathV1,pathV2,payload] of [
    ['/api/v1/roles/','/api/v2/roles/',{name:'x',slug:'bad'}],
    ['/api/v1/roles/switch','/api/v2/roles/switch',{roleId:'invalid'}],
  ])await sendPair('POST',pathV1,pathV2,payload);
  const deniedV1=await parseLegacy(await fetch(`${url}/api/v1/roles/`,{headers:{'x-test-deny':'1'}}));
  const deniedV2=parseV2(await app.inject({method:'GET',url:'/api/v2/roles/',headers:{'x-test-deny':'1'}}));await compare(deniedV1,deniedV2);
  const deniedPermissionV1=await parseLegacy(await fetch(`${url}/api/v1/permissions/`,{headers:{'x-test-deny':'1'}}));
  const deniedPermissionV2=parseV2(await app.inject({method:'GET',url:'/api/v2/permissions/',headers:{'x-test-deny':'1'}}));await compare(deniedPermissionV1,deniedPermissionV2);
});
