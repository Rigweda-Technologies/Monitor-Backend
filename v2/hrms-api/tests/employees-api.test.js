import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { registerEmployeeRoutes } from '../src/modules/employees/employee.routes.js';

const createApp = async (t, { authorize=async()=>null, suppliedService }={}) => {
  const app=await buildApp({config:loadConfig({MONGODB_URI:'mongodb://127.0.0.1/hrms_v2_test',JWT_SECRET:randomBytes(32).toString('hex')}),logger:false,authService:{},authenticate:async()=>({userId:'u1',organizationId:'o1'}),authorize,isReady:async()=>{}});
  const operations=['createByHr','completeMyProfile','listByOrganization','exportCsv','getNextEmployeeCode','getEmployeeLeaves','upcomingEvents','getMe','bulkUpdate','getById','updateByHr','lifecycleAction','reopenProfileCompletion','remove'];
  const service=suppliedService||Object.fromEntries(operations.map(name=>[name,async()=>name==='exportCsv'?['Employee Code,First Name\n']:({operation:name})]));
  registerEmployeeRoutes(app,{service,authenticate:async request=>{request.user={userId:'u1',organizationId:'o1'};},authorize});
  t.after(()=>app.close());
  return app;
};

test('employees API registers all fourteen v1 operations with OpenAPI schemas',async t=>{
  const app=await createApp(t);
  const expected=[
    ['POST','/api/v2/employees/'],['PUT','/api/v2/employees/me/profile'],['GET','/api/v2/employees/'],['GET','/api/v2/employees/export'],
    ['GET','/api/v2/employees/next-code'],['GET','/api/v2/employees/leave-types'],['GET','/api/v2/employees/upcoming-events'],['GET','/api/v2/employees/me'],
    ['PUT','/api/v2/employees/bulk-update'],['GET','/api/v2/employees/:id'],['PUT','/api/v2/employees/:id'],['PUT','/api/v2/employees/:id/lifecycle-action'],
    ['PUT','/api/v2/employees/:id/reopen-profile'],['DELETE','/api/v2/employees/:id'],
  ];
  for(const [method,url] of expected) assert.ok(app.applicationRoutes.some(route=>route.method===method&&route.url===url&&route.schema),`missing documented ${method} ${url}`);
  await app.ready();
  assert.ok(app.swagger().paths['/api/v2/employees/export'].get);
  assert.ok(app.swagger().paths['/api/v2/employees/{id}/lifecycle-action'].put);
});

test('employee profile route preserves authentication, permission, validation and response envelope',async t=>{
  const permissions=[];const app=await createApp(t,{authorize:async(permission)=>{permissions.push(permission);return null;}});
  const response=await app.inject({method:'PUT',url:'/api/v2/employees/me/profile',headers:{authorization:'Bearer token'},payload:{phone:'9876543210',dob:'1990-01-01',gender:'female',address:{line1:'12 Main St',city:'Pune',state:'Maharashtra',country:'India',zip:'411001'}}});
  assert.equal(response.statusCode,200);
  assert.deepEqual(permissions,['EMP_SELF_EDIT']);
  assert.deepEqual(response.json().data,{operation:'completeMyProfile'});
});

test('employee CSV export is emitted as a no-store attachment without a JSON envelope',async t=>{
  const app=await createApp(t);
  const response=await app.inject({method:'GET',url:'/api/v2/employees/export',headers:{authorization:'Bearer token'}});
  assert.equal(response.statusCode,200);
  assert.match(response.headers['content-type'],/text\/csv/);
  assert.equal(response.headers['cache-control'],'no-store');
  assert.match(response.body,/Employee Code/);
  assert.equal(response.headers['content-type'],'text/csv; charset=utf-8');
});

test('unauthorized employee operation is rejected before service invocation',async t=>{
  let called=false;
  const app=await createApp(t,{authorize:async()=>({code:403,message:'forbidden'}),suppliedService:{getMe:async()=>{called=true;}}});
  const response=await app.inject({method:'GET',url:'/api/v2/employees/me',headers:{authorization:'Bearer token'}});
  assert.equal(response.statusCode,403);
  assert.equal(called,false);
});
