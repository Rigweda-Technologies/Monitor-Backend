import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { registerOrganizationRoutes } from '../src/modules/organizations/organization.routes.js';
import { createOrganizationService } from '../src/modules/organizations/organization.service.js';
import { registerUserAdministrationRoutes } from '../src/modules/user-administration/user-administration.routes.js';
import { createUserAdministrationService } from '../src/modules/user-administration/user-administration.service.js';
import { createOrganizationPayrollRepository } from '../src/modules/organizations/organization-payroll.repository.js';

const oid = '507f1f77bcf86cd799439011';
const response = (success, code, message, data = null, error = null) => ({ success, code, message, data, error });
const makeApp = async (setup) => {
  const app = Fastify({ logger: false, routerOptions:{ ignoreTrailingSlash:true } });
  await setup(app);
  return app;
};
const auth = async request => { request.user = { userId: oid, organizationId: oid, activeOrganizationId: oid }; };
const permission = expected => async () => expected === 'DENY' ? { code: 403, message: 'Permission denied' } : null;

test('organization routes preserve auth, permission, validation and response contract', async t => {
  const calls = [];
  const service = Object.fromEntries(['create','update','getById','list','remove','lifecycleAction','clearPayrollData'].map(name => [name, async (...args) => { calls.push([name,...args]); return { id: oid }; }]));
  const schemas=[];
  const app = await makeApp(app => { app.addHook('onRoute',route=>schemas.push(route.schema)); return registerOrganizationRoutes(app, { service, authenticate: auth, authorize: permission() }); });
  t.after(() => app.close());
  assert.equal((await app.inject({ method: 'GET', url: '/api/v2/organizations/' })).statusCode, 200);
  assert.deepEqual((await app.inject({ method: 'GET', url: '/api/v2/organizations/' })).json(), response(true,200,'Organizations fetched successfully',{ id: oid }));
  assert.equal((await app.inject({ method: 'POST', url: '/api/v2/organizations', payload: { name:'Acme',code:'ACME',timezone:'UTC',currency:'INR' } })).statusCode,201);
  assert.equal((await app.inject({ method: 'POST', url: '/api/v2/organizations', payload: { name:'A',code:'a',timezone:'UTC',currency:'INR' } })).statusCode,406);
  const denied = await makeApp(app => registerOrganizationRoutes(app, { service, authenticate: auth, authorize: permission('DENY') }));
  t.after(() => denied.close());
  assert.equal((await denied.inject({ method:'GET',url:'/api/v2/organizations/' })).statusCode,403);
  assert.deepEqual(calls.map(call => call[0]), ['list','list','create']);
  assert.ok(schemas.length>=7);
  assert.ok(schemas.every(schema => schema?.summary && schema?.tags?.length));
});

test('organization service limits normal users to active member organizations and elevates superadmin listing', async () => {
  const filters = [];
  let superAdminChecks=0;
  const models = {
    OrgUser: { find: filter => ({ populate: async () => (++superAdminChecks===2)?[{ userId:oid,roleIds:[{slug:'superadmin'}] }]:[], select: async () => [{ organizationId: oid }] }) },
    Organization: { find: filter => { filters.push(filter); return { sort: async () => ['org'] }; } },
  };
  const service = createOrganizationService({ models });
  assert.deepEqual(await service.list({ user: { userId: oid } }), ['org']);
  assert.deepEqual(filters[0], { _id: { $in: [oid] }, status:'active' });
  assert.deepEqual(await service.list({ user: { userId: oid } }), ['org']);
  assert.deepEqual(filters[1], { code: { $ne:'SYSTEM' } });
});

test('organization creation requires SuperAdmin and seeds organization roles before return', async () => {
  const calls=[];
  const models={
    OrgUser:{find:()=>({populate:async()=>[]})},
    Organization:{create:async body=>{calls.push(['organization',body]);return {_id:oid,...body};}},
  };
  const service=createOrganizationService({models,seedOrganizationRoles:async id=>calls.push(['seed',id])});
  await assert.rejects(service.create({body:{name:'Acme',code:'ACME',timezone:'UTC',currency:'INR'},user:{userId:oid}}),error=>error.statusCode===403);
  const elevated=createOrganizationService({models,isSuperAdmin:async()=>true,seedOrganizationRoles:async id=>calls.push(['seed',id])});
  const organization=await elevated.create({body:{name:'Acme',code:'ACME',timezone:'UTC',currency:'INR'},user:{userId:oid}});
  assert.equal(organization._id,oid);
  assert.deepEqual(calls.map(call=>call[0]),['organization','seed']);
});

test('organization lifecycle soft delete preserves multi-organization users and deactivates sole members', async () => {
  const organization={_id:oid,code:'ACME',status:'active',save:async()=>{}};
  const sole={_id:'sole',email:'solo@example.com',organizationIds:[oid],activeOrganizationId:oid,tokenList:[{organizationId:oid}],save:async()=>{}};
  const shared={_id:'shared',email:'shared@example.com',save:async()=>{}};
  const models={
    OrgUser:{find:filter=>({select:async()=>[{userId:'sole'},{userId:'shared'}],populate:async()=>[]}),aggregate:async()=>[{_id:'sole',count:1},{_id:'shared',count:2}]},
    Organization:{findById:async()=>organization},
    User:{find:async()=>[sole,shared]},
  };
  const service=createOrganizationService({models,isSuperAdmin:async()=>true});
  const result=await service.lifecycleAction({organizationId:oid,action:'soft_delete',confirmationCode:'acme',actorUserId:'actor'});
  assert.deepEqual(result,{action:'soft_delete',organizationId:oid,renamedUsers:1,skippedUsers:1});
  assert.match(sole.email,/\+deleted-acme-/);
  assert.deepEqual(sole.organizationIds,[oid]);
  assert.equal(sole.activeOrganizationId,null);
  assert.deepEqual(sole.tokenList,[]);
  assert.equal(organization.status,'inactive');
});

test('organization lifecycle restore reactivates soft-deleted sole members and rejects a bad confirmation without mutation', async () => {
  const organization={_id:oid,code:'ACME',status:'inactive',isSoftDeleted:true,save:async()=>{}};
  const user={_id:'sole',email:'solo+deleted-acme-1@example.com',status:'inactive',organizationIds:[],activeOrganizationId:null,tokenList:[],softDeleteMeta:{organizationId:oid,originalEmail:'solo@example.com',deletedAt:new Date('2026-01-01T00:00:00.000Z')},save:async()=>{}};
  const models={
    OrgUser:{find:async()=>[]},
    Organization:{findById:async()=>organization},
    User:{
      find:async()=>[user],
      findOne:()=>({select:async()=>null}),
    },
  };
  const service=createOrganizationService({models,isSuperAdmin:async()=>true});
  await assert.rejects(service.lifecycleAction({organizationId:oid,action:'restore',confirmationCode:'WRONG',actorUserId:'actor'}),error=>error.statusCode===400);
  assert.equal(user.email,'solo+deleted-acme-1@example.com');
  assert.equal(organization.status,'inactive');
  const result=await service.lifecycleAction({organizationId:oid,action:'restore',confirmationCode:'acme',actorUserId:'actor'});
  assert.deepEqual(result,{action:'restore',organizationId:oid,restoredUsers:1,conflicts:0});
  assert.equal(user.email,'solo@example.com');
  assert.equal(user.status,'active');
  assert.equal(user.softDeleteMeta.organizationId,null);
  assert.equal(organization.status,'active');
  assert.equal(organization.isSoftDeleted,false);
});

test('organization payroll clear enforces superadmin confirmation and delegates transactional table cleanup', async () => {
  const organization={_id:oid,code:'ACME'};
  const cleared=[];
  const models={OrgUser:{find:async()=>[]},Organization:{findById:async()=>organization}};
  const service=createOrganizationService({models,isSuperAdmin:async()=>true,payrollRepository:{enabled:true,clearOrganization:async input=>{cleared.push(input);return {payrollEnabled:true,payrollTenantFound:true,tenantId:'tenant',clearedTables:{payroll_runs:2},clearedRowCount:2};}}});
  const result=await service.clearPayrollData({organizationId:oid,mode:'all',confirmationCode:'ACME',actorUserId:'actor'});
  assert.deepEqual(result,{action:'clear_payroll',organizationId:oid,organizationCode:'ACME',mode:'all',payrollEnabled:true,payrollTenantFound:true,tenantId:'tenant',clearedTables:{payroll_runs:2},clearedRowCount:2});
  assert.deepEqual({organizationId:cleared[0].organizationId,mode:cleared[0].mode,organizationCode:cleared[0].organizationCode},{organizationId:oid,mode:'all',organizationCode:'ACME'});
  assert.ok(cleared[0].tables.includes('pay_periods'));
  await assert.rejects(service.clearPayrollData({organizationId:oid,mode:'all',confirmationCode:'wrong',actorUserId:'actor'}),error=>error.statusCode===400);
});

test('Prisma payroll repository wraps allowlisted tenant deletes in one transaction', async () => {
  const calls=[];
  const transaction={
    $queryRawUnsafe:async (...args)=>{calls.push(['query',...args]);return args[0].startsWith('SELECT id')?[{id:'tenant-1'}]:[{table_name:'payroll_runs'}];},
    $executeRawUnsafe:async (...args)=>{calls.push(['delete',...args]);return 3;},
  };
  const prisma={$transaction:async callback=>{calls.push(['begin']);const value=await callback(transaction);calls.push(['commit']);return value;}};
  const repository=createOrganizationPayrollRepository({prisma});
  const result=await repository.clearOrganization({organizationId:oid,tables:['payroll_runs']});
  assert.deepEqual(result,{payrollTenantFound:true,tenantId:'tenant-1',clearedTables:{payroll_runs:3}});
  assert.equal(calls[0][0],'begin');
  assert.equal(calls.at(-1)[0],'commit');
  assert.ok(calls.some(call=>call[0]==='delete'&&call[1]==='DELETE FROM "payroll_runs" WHERE tenant_id = $1'&&call[2]==='tenant-1'));
  await assert.rejects(repository.clearOrganization({organizationId:oid,tables:['untrusted; DROP TABLE users']}),/not allowlisted/);
});

test('user administration routes enforce USER_VIEW/USER_CREATE and retain v1 envelopes', async t => {
  const service = { list: async () => ({ items: [], pagination: { total:0,page:1,limit:20,totalPages:0 } }), create: async () => ({ userId:oid,email:'person@example.com' }) };
  const app = await makeApp(app => registerUserAdministrationRoutes(app, { service, authenticate: auth, authorize: permission() }));
  t.after(() => app.close());
  const listed = await app.inject({ method:'GET',url:'/api/v2/users?page=1&limit=20' });
  assert.equal(listed.statusCode,200);
  assert.deepEqual(listed.json(), response(true,200,'Users fetched successfully',{ items:[],pagination:{total:0,page:1,limit:20,totalPages:0} }));
  const created = await app.inject({ method:'POST',url:'/api/v2/users/org-user',payload:{ email:'PERSON@example.com',password:'secret1',roleIds:[oid],firstName:'Person',lastName:'Example',employmentType:'full_time',dateOfJoining:'2025-01-01' } });
  assert.equal(created.statusCode,201);
  assert.equal(created.json().message,'User created successfully');
  assert.equal((await app.inject({ method:'POST',url:'/api/v2/users/org-user',payload:{ email:'bad',password:'x',roleIds:[],firstName:'P',lastName:'E' } })).statusCode,406);
  assert.match(app.printRoutes(), /api\/v2\/users \(GET/);
});

test('user administration service filters populated membership by email and creates scoped user, membership and employee', async () => {
  const calls = [];
  const models = {
    OrgUser: {
      find: filter => ({ populate(opts) { calls.push(['populate',filter,opts]); return this; }, skip(skip) { calls.push(['skip',skip]); return this; }, limit: async limit => { calls.push(['limit',limit]); return []; } }),
      countDocuments: async filter => { calls.push(['count',filter]); return 0; },
      create: async doc => calls.push(['membership',doc]),
    },
    User: { findOne: async () => null, create: async doc => { calls.push(['user',doc]); return { _id:oid,email:doc.email }; } },
    Role: { find: async () => [{ _id:'role1' }] },
    Employee: { countDocuments: async () => 0, findOne: async () => null, create: async doc => { calls.push(['employee',doc]); return { _id:'employee1' }; } },
    OrgSettings: { findOne: () => ({ lean:async () => ({ employeeIdPrefix:'AB' }) }) },
  };
  const service = createUserAdministrationService({ models, hashPassword: async value => `hashed:${value}`, initializeLeaveBalance: async () => {}, sendOnboardingEmail: async () => {} });
  const listed = await service.list({ organizationId:oid, query:{ search:'person', page:'2', limit:'5' } });
  assert.equal(listed.pagination.page,2);
  assert.equal(calls.find(call => call[0] === 'populate')[2].match.email.$regex,'person');
  const created = await service.create({ body:{ email:' Person@Example.com ',password:'secret1',roleIds:['role1'],firstName:'Person',lastName:'Example',employmentType:'full_time',dateOfJoining:'2025-01-01' },creator:{ activeOrganizationId:oid } });
  assert.deepEqual(created,{ userId:oid,email:'person@example.com' });
  assert.equal(calls.find(call => call[0] === 'user')[1].password,'hashed:secret1');
  assert.equal(calls.find(call => call[0] === 'membership')[1].organizationId,oid);
  assert.equal(calls.find(call => call[0] === 'employee')[1].employeeCode,'AB-0001');
});

test('real V1 and V2 user creation services return matching response and create equivalent scoped records', async t => {
  const makeStore=()=>{
    const rows={users:[],memberships:[],employees:[],leaveInitializations:[]};
    const models={
      User:{findOne:async filter=>rows.users.find(row=>row.email===filter.email)||null,create:async document=>{const row={_id:'user-generated',...document};rows.users.push(row);return row;}},
      OrgUser:{create:async document=>{rows.memberships.push(document);return document;}},
      Role:{find:async filter=>filter._id.$in.map(_id=>({_id}))},
      Employee:{countDocuments:async()=>rows.employees.length,findOne:filter=>{const row=rows.employees.find(item=>item.organizationId===filter.organizationId&&item.employeeCode===filter.employeeCode)||null;return{select(){return this;},then(resolve,reject){return Promise.resolve(row).then(resolve,reject);}};},create:async document=>{const row={_id:'employee-generated',...document};rows.employees.push(row);return row;}},
      OrgSettings:{findOne:()=>({select(){return this;},lean:async()=>({employeeIdPrefix:'AB'})})},
    };
    return {rows,models};
  };
  const body={email:' Person@Example.com ',password:'secret123',roleIds:['role-1'],firstName:'Person',lastName:'Example',employmentType:'full_time',dateOfJoining:'2025-01-01T00:00:00.000Z'};
  const identity={userId:'creator-1',organizationId:'organization-1',activeOrganizationId:'organization-1'};
  const v1Store=makeStore(),v2Store=makeStore();
  const legacy=createLegacyRouterHarness({mounts:[{path:'/api/v1/users',modulePath:'src/modules/users/user.routes.js'}],identity,sendMail:async()=>true,overrides:{
    'src/middlewares/auth.middleware.js':(req,_res,next)=>{req.user=identity;next();},
    'src/middlewares/authorize.middleware.js':()=> (_req,_res,next)=>next(),
    'src/modules/users/user.model.js':v1Store.models.User,
    'src/modules/organizations/org-user.model.js':v1Store.models.OrgUser,
    'src/modules/roles/role.model.js':v1Store.models.Role,
    'src/modules/employees/employee.model.js':v1Store.models.Employee,
    'src/modules/orgSettings/orgSettings.model.js':v1Store.models.OrgSettings,
    'src/modules/permissions/permission.model.js':{},
    'src/utils/bcryptUtils.js':{genHashedPassword:async value=>`hashed:${value}`,checkPasswords:async()=>false},
    'src/modules/leaveBalances/leaveBalance.service.js':{initializeForEmployee:async(employee,organizationId)=>v1Store.rows.leaveInitializations.push({employeeId:employee._id,organizationId})},
  }});
  const server=createServer(legacy);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const v2=await makeApp(app=>registerUserAdministrationRoutes(app,{service:createUserAdministrationService({models:v2Store.models,hashPassword:async value=>`hashed:${value}`,initializeLeaveBalance:async(employee,organizationId)=>v2Store.rows.leaveInitializations.push({employeeId:employee._id,organizationId}),sendOnboardingEmail:async()=>{},env:{}}),authenticate:async request=>{request.user=identity;},authorize:permission()}));
  t.after(()=>v2.close());
  const legacyResponse=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/users/org-user`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
  const v1={status:legacyResponse.status,body:await legacyResponse.json()};
  const response=await v2.inject({method:'POST',url:'/api/v2/users/org-user',payload:body});
  const v2Result={status:response.statusCode,body:response.json()};
  assert.deepEqual(v2Result,v1);
  const project=store=>({users:store.rows.users.map(({email,password,organizationIds,activeOrganizationId,status,passwordChangeRequired})=>({email,password,organizationIds,activeOrganizationId,status,passwordChangeRequired})),memberships:store.rows.memberships,employees:store.rows.employees.map(({organizationId,userId,firstName,lastName,employeeCode,employmentType,profileCompleted})=>({organizationId,userId,firstName,lastName,employeeCode,employmentType,profileCompleted})),leaveInitializations:store.rows.leaveInitializations});
  assert.deepEqual(project(v2Store),project(v1Store));
});
