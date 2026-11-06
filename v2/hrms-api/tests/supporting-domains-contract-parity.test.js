import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { createRuntime } from '../src/runtime.js';
import { loadConfig } from '../src/config/env.js';
import { createModels } from '../src/modules/auth/auth.models.js';
import { createEmployeeModels } from '../src/modules/employees/employee.models.js';
import { createOrgSettingsModels } from '../src/modules/org-settings/org-settings.models.js';
import { createDepartmentModels } from '../src/modules/departments/department.models.js';
import { createLeaveTypeModels } from '../src/modules/leave-types/leave-type.models.js';
import { createLeaveBalanceModels } from '../src/modules/leave-balances/leave-balance.models.js';
import { createHolidayModels } from '../src/modules/holidays/holiday.models.js';
import { createWeekOffModels } from '../src/modules/week-offs/week-off.models.js';
import { createShiftModels } from '../src/modules/shifts/shift.models.js';
import { createApprovalFlowModels } from '../src/modules/approval-flows/approval-flow.models.js';

const baseUri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const isolatedLocal = Boolean(baseUri) && ['localhost', '127.0.0.1', '::1'].includes(new URL(baseUri).hostname) && /[_-](test|isolated|ci)([_-]|$)/i.test(new URL(baseUri).pathname);
const uriFor = suffix => { const url = new URL(baseUri); url.pathname = `${url.pathname.replace(/\/$/, '')}_supporting_${suffix}`; return url.toString(); };
const timeout = (promise, label) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), 10000); })]).finally(() => clearTimeout(timer));
};
const modelsFor = connection => ({
  ...createEmployeeModels(connection), ...createModels(connection), ...createDepartmentModels(connection), ...createOrgSettingsModels(connection),
  ...createLeaveTypeModels(connection), ...createLeaveBalanceModels(connection),
  ...createHolidayModels(connection), ...createWeekOffModels(connection), ...createShiftModels(connection),
  ...createApprovalFlowModels(connection),
});
const mounted = [
  ['/api/v1/leave-types','src/modules/leaveTypes/leaveType.routes.js'],
  ['/api/v1/leave-balances','src/modules/leaveBalances/leaveBalance.routes.js'],
  ['/api/v1/holidays','src/modules/holidays/holiday.routes.js'],
  ['/api/v1/week-offs','src/modules/weekOffs/weekOff.routes.js'],
  ['/api/v1/shifts','src/modules/shifts/shift.routes.js'],
  ['/api/v1/approval-flows','src/modules/approvalFlows/approvalFlow.routes.js'],
];
const operations = [
  ['POST','/leave-types/','LEAVE_TYPE_MANAGE',{}], ['GET','/leave-types/','LEAVE_TYPE_VIEW'], ['PUT','/leave-types/000000000000000000000001','LEAVE_TYPE_MANAGE',{ name:'!' }], ['DELETE','/leave-types/000000000000000000000001','LEAVE_TYPE_MANAGE'],
  ['GET','/leave-balances/my','LEAVE_VIEW_SELF'], ['GET','/leave-balances/employee/000000000000000000000001','LEAVE_VIEW_ALL'], ['POST','/leave-balances/employee/000000000000000000000001/adjust','LEAVE_VIEW_ALL',{}], ['POST','/leave-balances/adjust-all','LEAVE_VIEW_ALL',{}],
  ['POST','/holidays/','HOLIDAY_MANAGE',{}], ['GET','/holidays/','HOLIDAY_VIEW'], ['PUT','/holidays/000000000000000000000001','HOLIDAY_MANAGE',{ status:'bad' }], ['DELETE','/holidays/000000000000000000000001','HOLIDAY_MANAGE'],
  ['POST','/week-offs/','WEEK_OFF_MANAGE',{}], ['GET','/week-offs/','WEEK_OFF_VIEW'], ['GET','/week-offs/all','WEEK_OFF_VIEW'],
  ['POST','/shifts/','SHIFT_MANAGE',{}], ['GET','/shifts/','SHIFT_VIEW'], ['GET','/shifts/my','SHIFT_VIEW_SELF'], ['PUT','/shifts/not-an-id','SHIFT_MANAGE',{ graceMinutes:181 }], ['DELETE','/shifts/not-an-id','SHIFT_MANAGE'],
  ['POST','/approval-flows/','APPROVAL_FLOW_MANAGE',{}], ['GET','/approval-flows/','APPROVAL_FLOW_VIEW'], ['PUT','/approval-flows/000000000000000000000001','APPROVAL_FLOW_MANAGE',{ moduleKey:'wrong' }], ['DELETE','/approval-flows/000000000000000000000001','APPROVAL_FLOW_MANAGE'],
];
const read = async response => ({ status: response.status, contentType: response.headers.get('content-type'), body: await response.json() });

test('V1/V2 supporting HRMS routes match auth and validation contracts against isolated local Mongo', { skip: !baseUri }, async t => {
  assert.ok(isolatedLocal, 'V2_HRMS_ISOLATED_TEST_DATABASE_URL must be local and use a test/isolated/ci database name');
  const secret = 'supporting-domains-contract-parity-test-secret-123456';
  const ids = { organization:new mongoose.Types.ObjectId(), user:new mongoose.Types.ObjectId(), role:new mongoose.Types.ObjectId(), employee:new mongoose.Types.ObjectId(), leaveType:new mongoose.Types.ObjectId(), leaveBalance:new mongoose.Types.ObjectId(), shift:new mongoose.Types.ObjectId() };
  const codes = [...new Set(operations.map(([, , permission]) => permission))];
  const permissions = Object.fromEntries(codes.map(code => [code,new mongoose.Types.ObjectId()]));
  const token = jwt.sign({ userId:ids.user, organizationId:ids.organization, activeRoleId:ids.role, roleIds:[ids.role] },secret,{ expiresIn:'1h' });
  const identity = { userId:ids.user, _id:ids.user, email:'employee@example.test', organizationId:ids.organization, activeRoleId:ids.role, rolePermissions:codes };
  const v1Connection = await timeout(mongoose.createConnection(uriFor('v1'),{ autoCreate:false,autoIndex:false }).asPromise(),'V1 Mongo');
  const v2Connection = await timeout(mongoose.createConnection(uriFor('v2'),{ autoCreate:false,autoIndex:false }).asPromise(),'V2 Mongo');
  const v1Models = modelsFor(v1Connection);
  const config = loadConfig({ MONGODB_URI:uriFor('v2'), JWT_SECRET:secret, BCRYPT_SALT_ROUNDS:'4' });
  const v2 = await timeout(createRuntime({ config,connection:v2Connection,logger:false,realtimeEnabled:false,sendOtp:async()=>{},verifySelfie:async()=>({confidence:99}) }),'V2 runtime');
  const v1Auth = (req,res,next) => { if (!req.headers.authorization) return res.status(401).json({ success:false,code:401,message:'Authorization token missing',data:null,error:null }); req.user={...identity}; next(); };
  const v1Authorize = required => (req,res,next) => { const list=Array.isArray(required)?required:[required]; return list.some(code=>req.user.rolePermissions.includes(code)) ? next() : res.status(403).json({ success:false,code:403,message:`Permission denied: ${list.join(' | ')}`,data:null,error:null }); };
  const v1 = createLegacyRouterHarness({ mounts:mounted.map(([path,modulePath])=>({path,modulePath})), identity, overrides:{
    'src/middlewares/auth.middleware.js':v1Auth, 'src/middlewares/authorize.middleware.js':v1Authorize,
    'src/modules/organizations/organization.model.js':v1Models.Organization,
    'src/modules/roles/role.model.js':v1Models.Role,
    'src/modules/permissions/permission.model.js':v1Models.Permission,
    'src/modules/employees/employee.model.js':v1Models.Employee,
    'src/modules/orgSettings/orgSettings.model.js':v1Models.OrgSettings,
    'src/modules/leaveTypes/leaveType.model.js':v1Models.LeaveType,
    'src/modules/leaveBalances/leaveBalance.model.js':v1Models.LeaveBalance,
    'src/modules/holidays/holiday.model.js':v1Models.Holiday,
    'src/modules/weekOffs/weekOff.model.js':v1Models.WeekOff,
    'src/modules/shifts/shift.model.js':v1Models.Shift,
    'src/modules/approvalFlows/approvalFlow.model.js':v1Models.ApprovalFlow,
    'src/modules/auditLogs/auditLogs.service.js':{ audit:async()=>{} },
  }});
  const server = v1.listen(0,'127.0.0.1');
  await timeout(new Promise(resolve=>server.once('listening',resolve)),'V1 listen');
  t.after(async()=>{ await new Promise(resolve=>server.close(resolve)); await v2.close(); await v1Connection.dropDatabase(); await v2Connection.dropDatabase(); await v1Connection.close(); await v2Connection.close(); });

  const seed = async connection => {
    const m=modelsFor(connection), now=new Date('2026-10-01T00:00:00.000Z');
    await m.Organization.collection.insertOne({ _id:ids.organization,name:'Parity Org',code:'PARITY-SD',timezone:'Asia/Kolkata',currency:'INR',status:'active',leaveCycleStartMonth:1,createdAt:now,updatedAt:now });
    await m.User.collection.insertOne({ _id:ids.user,email:'employee@example.test',password:'synthetic',organizationIds:[ids.organization],activeOrganizationId:ids.organization,tokenList:[{token,organizationId:ids.organization,status:'active',loginTimestamp:now.toISOString()}],status:'active',createdAt:now,updatedAt:now });
    await m.Permission.collection.insertMany(Object.entries(permissions).map(([code,_id])=>({_id,organizationId:ids.organization,code,name:code,createdAt:now,updatedAt:now})));
    await m.Role.collection.insertOne({ _id:ids.role,organizationId:ids.organization,name:'Employee',slug:'employee',permissionIds:Object.values(permissions),isSystemRole:false,status:'active',createdAt:now,updatedAt:now });
    await m.Membership.collection.insertOne({ userId:ids.user,organizationId:ids.organization,roleIds:[ids.role],createdAt:now,updatedAt:now });
    await m.Employee.collection.insertOne({ _id:ids.employee,organizationId:ids.organization,userId:ids.user,firstName:'Casey',lastName:'Employee',employeeCode:'E-001',dateOfJoining:now,employmentType:'full_time',employmentLifecycleStatus:'confirmed',status:'active',isDeleted:false,shiftId:ids.shift,createdAt:now,updatedAt:now });
    await m.OrgSettings.collection.insertOne({ organizationId:ids.organization,timezone:'Asia/Kolkata',leaveCreditFrequency:'monthly',createdAt:now,updatedAt:now });
    await m.LeaveType.collection.insertOne({ _id:ids.leaveType,organizationId:ids.organization,name:'Annual Leave',code:'AL',daysPerYear:12,status:'active',createdAt:now,updatedAt:now });
    await m.LeaveBalance.collection.insertOne({ _id:ids.leaveBalance,organizationId:ids.organization,employeeId:ids.employee,leaveTypeId:ids.leaveType,cycleStartYear:2026,total:12,used:0,pending:0,remaining:12,createdAt:now,updatedAt:now });
    await m.Shift.collection.insertOne({ _id:ids.shift,organizationId:ids.organization,name:'Day Shift',code:'DAY',startTime:'09:00',endTime:'17:00',graceMinutes:0,status:'active',createdAt:now,updatedAt:now });
  };
  await seed(v1Connection); await seed(v2Connection);
  const v1Base=`http://127.0.0.1:${server.address().port}`;
  const requestPair=async({method,path,payload,auth=true})=>{
    const headers={...(auth?{authorization:`Bearer ${token}`}:{})}; if(payload!==undefined)headers['content-type']='application/json';
    const init={method,headers,...(payload!==undefined?{body:JSON.stringify(payload)}:{})};
    const expected=await read(await timeout(fetch(`${v1Base}/api/v1${path}`,{...init,signal:AbortSignal.timeout(7000)}),`V1 ${method} ${path}`).then(r=>r));
    const actualResponse=await timeout(v2.app.inject({method,url:`/api/v2${path}`,headers,...(payload!==undefined?{payload}:{})}),`V2 ${method} ${path}`);
    const actual={status:actualResponse.statusCode,contentType:actualResponse.headers['content-type'],body:actualResponse.json()};
    assert.equal(actual.status,expected.status,`${method} ${path} status; V1=${JSON.stringify(expected.body)} V2=${JSON.stringify(actual.body)}`);
    assert.equal(actual.contentType,expected.contentType,`${method} ${path} content-type`);
    assert.deepEqual(actual.body,expected.body,`${method} ${path} body`);
  };

  await t.test('all 24 registrations match missing-auth status, body and content type',async()=>{
    assert.equal(operations.length,24);
    for(const [method,path,,payload] of operations) await requestPair({method,path,payload,auth:false});
  });
  await t.test('all 11 create, update and adjustment validators match their invalid-input response',async()=>{
    for(const [method,path,,payload] of operations.filter(([,path,,payload])=>payload!==undefined)) await requestPair({method,path,payload});
  });
  await t.test('each group read route matches with seeded employee, leave, shift and org records',async()=>{
    for(const [method,path] of [
      ['GET','/leave-types/'],['GET','/leave-balances/my'],['GET',`/leave-balances/employee/${ids.employee}`],
      ['GET','/holidays/'],['GET','/week-offs/'],['GET','/week-offs/all'],['GET','/shifts/'],['GET','/shifts/my'],['GET','/approval-flows/'],
    ]) await requestPair({method,path});
  });
});
