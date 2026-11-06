import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { registerOrganizationRoutes } from '../src/modules/organizations/organization.routes.js';
import { registerUserAdministrationRoutes } from '../src/modules/user-administration/user-administration.routes.js';
import { registerDashboardRoutes } from '../src/modules/dashboard/dashboard.routes.js';
import { errorHandler } from '../src/plugins/errors.js';

const organizationId='507f1f77bcf86cd799439011';
const identity={userId:'507f1f77bcf86cd799439012',organizationId,activeOrganizationId:organizationId,activeRoleId:'superadmin',roleKey:'superadmin'};
const success=(data,message='Success',code=200)=>({success:true,code,message,data,error:null});
const failure=(code,message,error=null)=>({success:false,code,message,data:null,error});
const orgBody={name:'Parity Org',code:'PARITY',timezone:'Asia/Kolkata',currency:'INR'};
const userBody={email:'parity.user@example.com',password:'secret123',roleIds:['507f1f77bcf86cd799439013'],firstName:'Parity',lastName:'User',employmentType:'full_time',dateOfJoining:'2025-01-01T00:00:00.000Z'};

const compareResponse=async(a,b,{normalize=body=>body}={})=>{
  assert.equal(a.status,b.status);
  const contentType=value=>typeof value?.get==='function'?value.get('content-type'):value?.['content-type'];
  assert.equal(contentType(a.headers)?.split(';')[0],contentType(b.headers)?.split(';')[0]);
  assert.deepEqual(normalize(a.body),normalize(b.body));
};
const parse=response=>({status:response.statusCode,headers:response.headers,body:response.json()});
const readExpress=async(response)=>({status:response.status,headers:response.headers,body:JSON.parse(await response.text())});
const normalizeIds=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='_id'&&item||key==='userId'&&/^[a-f0-9]{24}$/i.test(String(item||''))?'<id>':['createdAt','updatedAt'].includes(key)&&item?'<timestamp>':item));

test('direct V1/V2 organization, user administration and dashboard HTTP contracts match over isolated localhost Mongo fixtures',async t=>{
  const suffix=randomBytes(6).toString('hex'),dbName=`hrms_contract_${process.pid}_${suffix}`;
  const uri=`mongodb://127.0.0.1:27017/${dbName}`;
  const connection=await mongoose.createConnection(uri,{serverSelectionTimeoutMS:1800,autoIndex:false,autoCreate:false}).asPromise().catch(()=>null);
  if(!connection){t.skip('isolated localhost MongoDB is unavailable');return;}
  t.after(async()=>{await connection.dropDatabase();await connection.close();});
  const fixtureSchema=new mongoose.Schema({name:String,code:String,timezone:String,currency:String,status:String,isSoftDeleted:Boolean},{timestamps:true,collection:'organizations',autoCreate:false,autoIndex:false});
  const Organization=connection.model('ParityOrganization',fixtureSchema,'organizations');
  const userSchema=new mongoose.Schema({email:String,status:String,activeOrganizationId:mongoose.Schema.Types.ObjectId,organizationIds:[mongoose.Schema.Types.ObjectId]},{timestamps:true,collection:'users',autoCreate:false,autoIndex:false});
  const User=connection.model('ParityUser',userSchema,'users');
  const fixedOrganization=await Organization.create({_id:organizationId,...orgBody,status:'active'});
  await User.create({_id:identity.userId,email:'fixture@example.com',status:'active',activeOrganizationId:organizationId,organizationIds:[organizationId]});
  const v1Services={
    organization:{
      createOrganization:async body=>Organization.create(body),
      updateOrganization:async(id,body)=>Organization.findByIdAndUpdate(id,body,{new:true}),
      getOrganizationById:async id=>{const result=await Organization.findById(id);if(!result)throw {code:404,message:'Organization not found'};return result;},
      getOrganizations:async()=>Organization.find({code:{$ne:'SYSTEM'}}).sort({createdAt:-1}),
      deleteOrganization:async id=>{const result=await Organization.findByIdAndUpdate(id,{status:'inactive',isSoftDeleted:true},{new:true});if(!result)throw {code:404,message:'Organization not found'};return true;},
      applyOrganizationLifecycleAction:async input=>({action:input.action,organizationId:String(input.organizationId),renamedUsers:0,skippedUsers:0}),
      clearOrganizationPayrollData:async input=>({action:'clear_payroll',organizationId:String(input.organizationId),mode:input.mode||'generated',payrollEnabled:false,payrollTenantFound:false,tenantId:null,clearedTables:{},clearedRowCount:0}),
    },
    users:{
      listByOrganization:async({query={}}={})=>{const page=Number(query.page||1),limit=Number(query.limit||20),items=(await User.find({activeOrganizationId:organizationId}).sort({createdAt:1}).skip((page-1)*limit).limit(limit)).map(user=>({userId:user._id,email:user.email,status:user.status,activeOrganizationId:user.activeOrganizationId,roles:[]})),total=await User.countDocuments({activeOrganizationId:organizationId});return {items,pagination:{total,page,limit,totalPages:Math.ceil(total/limit)}};},
      createOrgUser:async body=>{const user=await User.create({email:body.email.toLowerCase(),status:'active',activeOrganizationId:organizationId,organizationIds:[organizationId]});return {userId:user._id,email:user.email};},
    },
    dashboard:{getSummary:async()=>({dashboardStats:{kpis:{totalEmployees:await User.countDocuments({activeOrganizationId:organizationId}),presentToday:1}},orgSettings:{timezone:(await Organization.findById(organizationId))?.timezone||'Asia/Kolkata'}})},
  };
  const permissionError=(req,res,next)=>req.headers['x-test-deny']?res.status(403).json(failure(403,'Permission denied')):next();
  const legacy=createLegacyRouterHarness({identity,overrides:{
    'src/middlewares/authorize.middleware.js':()=>permissionError,
    'src/modules/organizations/organization.service.js':v1Services.organization,
    'src/modules/users/user.service.js':v1Services.users,
    'src/modules/dashboard/dashboard.service.js':v1Services.dashboard,
  },mounts:[
    {path:'/api/v1/organizations',modulePath:'src/modules/organizations/organization.routes.js'},
    {path:'/api/v1/users',modulePath:'src/modules/users/user.routes.js'},
    {path:'/api/v1/dashboard',modulePath:'src/modules/dashboard/dashboard.routes.js'},
  ]});
  const legacyServer=createServer(legacy);
  await new Promise((resolve,reject)=>legacyServer.once('error',reject).listen(0,'127.0.0.1',resolve));
  const legacyUrl=`http://127.0.0.1:${legacyServer.address().port}`;
  t.after(()=>new Promise(resolve=>legacyServer.close(resolve)));
  const v2=Fastify({logger:false});
  const authorize=async(_permission,request)=>request.headers['x-test-deny']?{code:403,message:'Permission denied'}:null;
  const v2Services={
    organization:{create:({body})=>v1Services.organization.createOrganization(body),update:v1Services.organization.updateOrganization,getById:v1Services.organization.getOrganizationById,list:()=>v1Services.organization.getOrganizations(),remove:v1Services.organization.deleteOrganization,lifecycleAction:v1Services.organization.applyOrganizationLifecycleAction,clearPayrollData:v1Services.organization.clearOrganizationPayrollData},
    users:{list:({query})=>v1Services.users.listByOrganization({query}),create:({body})=>v1Services.users.createOrgUser(body)},
    dashboard:{getSummary:v1Services.dashboard.getSummary},
  };
  await registerOrganizationRoutes(v2,{service:v2Services.organization,authenticate:async request=>{request.user=identity;},authorize});
  await registerUserAdministrationRoutes(v2,{service:v2Services.users,authenticate:async request=>{request.user=identity;},authorize});
  await registerDashboardRoutes(v2,{service:v2Services.dashboard,authenticate:async request=>{request.user=identity;},authorize});
  await v2.ready();
  t.after(()=>v2.close());
  const pairs=[
    ['GET','/api/v1/organizations/','/api/v2/organizations/',undefined],
    ['GET',`/api/v1/organizations/${organizationId}`,`/api/v2/organizations/${organizationId}`,undefined],
    ['PUT',`/api/v1/organizations/${organizationId}`,`/api/v2/organizations/${organizationId}`,{name:'Parity Org Updated'}],
    ['POST','/api/v1/organizations/','/api/v2/organizations/',{...orgBody,code:'NEWPARITY'}],
    ['DELETE',`/api/v1/organizations/${organizationId}`,`/api/v2/organizations/${organizationId}`,undefined],
    ['POST',`/api/v1/organizations/${organizationId}/lifecycle`,`/api/v2/organizations/${organizationId}/lifecycle`,{action:'soft_delete',confirmationCode:'PARITY'}],
    ['POST',`/api/v1/organizations/${organizationId}/payroll-clear`,`/api/v2/organizations/${organizationId}/payroll-clear`,{mode:'generated',confirmationCode:'PARITY'}],
    ['GET','/api/v1/users/?page=1&limit=20','/api/v2/users?page=1&limit=20',undefined],
    ['POST','/api/v1/users/org-user','/api/v2/users/org-user',userBody],
    ['GET','/api/v1/dashboard/summary?month=2026-11&year=2026','/api/v2/dashboard/summary?month=2026-11&year=2026',undefined],
  ];
  for(const [method,v1url,v2url,payload] of pairs){
    const v1response=await readExpress(await fetch(`${legacyUrl}${v1url}`,{method,headers:{'content-type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})}));
    const v2response=parse(await v2.inject({method,url:v2url,...(payload?{payload}:{})}));
    await compareResponse(v1response,v2response,{normalize:normalizeIds});
  }
  assert.ok(await Organization.countDocuments({code:'NEWPARITY'}));
  assert.equal((await Organization.findById(fixedOrganization._id)).name,'Parity Org Updated');
  assert.equal(await User.countDocuments({email:'parity.user@example.com'}),2);

  for(const [method,v1url,v2url,payload] of [
    ['POST','/api/v1/organizations/','/api/v2/organizations/',{name:'x',code:'a',timezone:'UTC',currency:'INR'}],
    ['POST','/api/v1/users/org-user','/api/v2/users/org-user',{...userBody,email:'not-an-email'}],
  ]){
    const a=await readExpress(await fetch(`${legacyUrl}${v1url}`,{method,headers:{'content-type':'application/json'},body:JSON.stringify(payload)}));
    const b=parse(await v2.inject({method,url:v2url,payload}));
    await compareResponse(a,b);
  }
  const deniedV1=await readExpress(await fetch(`${legacyUrl}/api/v1/organizations/${organizationId}`,{headers:{'x-test-deny':'1'}}));
  const deniedV2=parse(await v2.inject({method:'GET',url:`/api/v2/organizations/${organizationId}`,headers:{'x-test-deny':'1'}}));
  await compareResponse(deniedV1,deniedV2);

  const failingV1=createLegacyRouterHarness({identity,overrides:{
    'src/middlewares/authorize.middleware.js':()=>permissionError,
    'src/modules/organizations/organization.service.js':{...v1Services.organization,getOrganizationById:async()=>{throw {code:503,message:'Fixture service unavailable'};}},
  },mounts:[{path:'/api/v1/organizations',modulePath:'src/modules/organizations/organization.routes.js'}]});
  const failingServer=createServer(failingV1);
  await new Promise((resolve,reject)=>failingServer.once('error',reject).listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>failingServer.close(resolve)));
  const failingUrl=`http://127.0.0.1:${failingServer.address().port}`;
  const failingV2=Fastify({logger:false});
  t.after(()=>failingV2.close());
  failingV2.setErrorHandler(errorHandler);
  await registerOrganizationRoutes(failingV2,{service:{...v2Services.organization,getById:async()=>{throw Object.assign(new Error('Fixture service unavailable'),{statusCode:503,publicMessage:'Fixture service unavailable'});}},authenticate:async request=>{request.user=identity;},authorize});
  const failureA=await readExpress(await fetch(`${failingUrl}/api/v1/organizations/${organizationId}`));
  const failureB=parse(await failingV2.inject({method:'GET',url:`/api/v2/organizations/${organizationId}`}));
  await compareResponse(failureA,failureB);
});
