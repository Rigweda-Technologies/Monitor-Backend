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

const baseUri=process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const isolatedLocal=Boolean(baseUri)&&['localhost','127.0.0.1','::1'].includes(new URL(baseUri).hostname)&&/[_-](test|isolated|ci)([_-]|$)/i.test(new URL(baseUri).pathname);
const uriFor=suffix=>{const url=new URL(baseUri);url.pathname=`${url.pathname.replace(/\/$/,'')}_supporting_writes_${suffix}`;return url.toString();};
const timeout=(promise,label)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`Timed out waiting for ${label}`)),10000);})]).finally(()=>clearTimeout(timer));};
const modelsFor=connection=>({
  ...createEmployeeModels(connection),...createModels(connection),...createDepartmentModels(connection),...createOrgSettingsModels(connection),
  ...createLeaveTypeModels(connection),...createLeaveBalanceModels(connection),...createHolidayModels(connection),...createWeekOffModels(connection),
  ...createShiftModels(connection),...createApprovalFlowModels(connection),
});
const mountPaths=[
  ['/api/v1/leave-types','src/modules/leaveTypes/leaveType.routes.js'],['/api/v1/leave-balances','src/modules/leaveBalances/leaveBalance.routes.js'],
  ['/api/v1/holidays','src/modules/holidays/holiday.routes.js'],['/api/v1/week-offs','src/modules/weekOffs/weekOff.routes.js'],
  ['/api/v1/shifts','src/modules/shifts/shift.routes.js'],['/api/v1/approval-flows','src/modules/approvalFlows/approvalFlow.routes.js'],
];
const permissions=['LEAVE_TYPE_MANAGE','LEAVE_TYPE_VIEW','LEAVE_VIEW_SELF','LEAVE_VIEW_ALL','HOLIDAY_MANAGE','HOLIDAY_VIEW','LEAVE_APPLY','WEEK_OFF_MANAGE','WEEK_OFF_VIEW','SHIFT_MANAGE','SHIFT_VIEW','SHIFT_VIEW_SELF','APPROVAL_FLOW_MANAGE','APPROVAL_FLOW_VIEW'];
const normalize=value=>{
  if(value instanceof Date)return value.toISOString();
  if(value&&typeof value.toHexString==='function')return '<objectId>';
  if(Array.isArray(value))return value.map(normalize);
  if(!value||typeof value!=='object')return typeof value==='string'&&/^[a-f\d]{24}$/i.test(value)?'<objectId>':value;
  return Object.fromEntries(Object.entries(value).filter(([key])=>!['_id','__v','createdAt','updatedAt'].includes(key)).map(([key,item])=>[key,normalize(item)]));
};
const readJson=async response=>({status:response.status,contentType:response.headers.get('content-type'),body:await response.json()});

test('V1/V2 supporting HRMS successful write parity on isolated Mongo databases',{skip:!baseUri},async t=>{
  assert.ok(isolatedLocal,'V2_HRMS_ISOLATED_TEST_DATABASE_URL must be local and use a test/isolated/ci database name');
  const secret='supporting-write-parity-test-secret-0123456789';
  const ids={organization:new mongoose.Types.ObjectId(),user:new mongoose.Types.ObjectId(),role:new mongoose.Types.ObjectId(),employee:new mongoose.Types.ObjectId(),employee2:new mongoose.Types.ObjectId(),annualType:new mongoose.Types.ObjectId(),updateType:new mongoose.Types.ObjectId(),deleteType:new mongoose.Types.ObjectId(),annualBalance:new mongoose.Types.ObjectId(),holidayUpdate:new mongoose.Types.ObjectId(),holidayDelete:new mongoose.Types.ObjectId(),shiftUpdate:new mongoose.Types.ObjectId(),shiftDelete:new mongoose.Types.ObjectId(),flowUpdate:new mongoose.Types.ObjectId(),flowDelete:new mongoose.Types.ObjectId()};
  const permissionIds=Object.fromEntries(permissions.map(code=>[code,new mongoose.Types.ObjectId()]));
  const token=jwt.sign({userId:ids.user,organizationId:ids.organization,activeRoleId:ids.role,roleIds:[ids.role]},secret,{expiresIn:'1h'});
  const identity={userId:ids.user,_id:ids.user,email:'supporting-write@example.test',organizationId:ids.organization,activeRoleId:ids.role,rolePermissions:permissions};
  const v1Connection=await timeout(mongoose.createConnection(uriFor('v1'),{autoCreate:false,autoIndex:false}).asPromise(),'V1 Mongo');
  const v2Connection=await timeout(mongoose.createConnection(uriFor('v2'),{autoCreate:false,autoIndex:false}).asPromise(),'V2 Mongo');
  const v1Models=modelsFor(v1Connection);
  const config=loadConfig({MONGODB_URI:uriFor('v2'),JWT_SECRET:secret,BCRYPT_SALT_ROUNDS:'4'});
  const v2=await timeout(createRuntime({config,connection:v2Connection,logger:false,realtimeEnabled:false,sendOtp:async()=>{},verifySelfie:async()=>({confidence:99})}),'V2 runtime');
  const v2Models={...v2.employeeModels,...v2.leaveTypeModels,...v2.leaveBalanceModels,...v2.holidayModels,...v2.weekOffModels,...v2.shiftModels,...v2.approvalFlowModels,...v2.departmentModels};
  const v1Auth=(req,res,next)=>{if(!req.headers.authorization)return res.status(401).json({success:false,code:401,message:'Authorization token missing',data:null,error:null});req.user={...identity};next();};
  const v1Authorize=required=>(req,res,next)=>{const allowed=Array.isArray(required)?required:[required];return allowed.some(code=>req.user.rolePermissions.includes(code))?next():res.status(403).json({success:false,code:403,message:`Permission denied: ${allowed.join(' | ')}`,data:null,error:null});};
  const v1=createLegacyRouterHarness({mounts:mountPaths.map(([path,modulePath])=>({path,modulePath})),identity,overrides:{
    'src/middlewares/auth.middleware.js':v1Auth,'src/middlewares/authorize.middleware.js':v1Authorize,
    'src/modules/organizations/organization.model.js':v1Models.Organization,'src/modules/employees/employee.model.js':v1Models.Employee,
    'src/modules/roles/role.model.js':v1Models.Role,'src/modules/permissions/permission.model.js':v1Models.Permission,
    'src/modules/orgSettings/orgSettings.model.js':v1Models.OrgSettings,'src/modules/leaveTypes/leaveType.model.js':v1Models.LeaveType,
    'src/modules/leaveBalances/leaveBalance.model.js':v1Models.LeaveBalance,'src/modules/holidays/holiday.model.js':v1Models.Holiday,
    'src/modules/weekOffs/weekOff.model.js':v1Models.WeekOff,'src/modules/shifts/shift.model.js':v1Models.Shift,
    'src/modules/approvalFlows/approvalFlow.model.js':v1Models.ApprovalFlow,'src/modules/auditLogs/auditLogs.service.js':{audit:async()=>{}},
  }});
  const server=v1.listen(0,'127.0.0.1');await timeout(new Promise(resolve=>server.once('listening',resolve)),'V1 listen');
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await v2.close();await v1Connection.dropDatabase();await v2Connection.dropDatabase();await v1Connection.close();await v2Connection.close();});

  const seed=async connection=>{
    const m=modelsFor(connection),now=new Date('2026-10-01T00:00:00.000Z');
    await m.Organization.collection.insertOne({_id:ids.organization,name:'Write Parity Org',code:'WRITE-PARITY',timezone:'Asia/Kolkata',currency:'INR',status:'active',leaveCycleStartMonth:1,createdAt:now,updatedAt:now});
    await m.User.collection.insertOne({_id:ids.user,email:identity.email,password:'synthetic',organizationIds:[ids.organization],activeOrganizationId:ids.organization,tokenList:[{token,organizationId:ids.organization,status:'active',loginTimestamp:now.toISOString()}],status:'active',createdAt:now,updatedAt:now});
    await m.Permission.collection.insertMany(Object.entries(permissionIds).map(([code,_id])=>({_id,organizationId:ids.organization,code,name:code,createdAt:now,updatedAt:now})));
    await m.Role.collection.insertOne({_id:ids.role,organizationId:ids.organization,name:'HR Admin',slug:'admin',permissionIds:Object.values(permissionIds),isSystemRole:false,status:'active',createdAt:now,updatedAt:now});
    await m.Membership.collection.insertOne({userId:ids.user,organizationId:ids.organization,roleIds:[ids.role],createdAt:now,updatedAt:now});
    for(const [employeeId,userId,code] of [[ids.employee,ids.user,'E-WRITE-1'],[ids.employee2,new mongoose.Types.ObjectId(),'E-WRITE-2']])await m.Employee.collection.insertOne({_id:employeeId,organizationId:ids.organization,userId,firstName:'Casey',lastName:code.endsWith('1')?'One':'Two',employeeCode:code,dateOfJoining:new Date('2026-01-01T00:00:00.000Z'),employmentType:'full_time',employmentLifecycleStatus:'confirmed',status:'active',isDeleted:false,createdAt:now,updatedAt:now});
    await m.OrgSettings.collection.insertOne({organizationId:ids.organization,timezone:'Asia/Kolkata',leaveCreditFrequency:'yearly',leaveTypeCreditMode:'full_year',attendanceLockEnabled:false,createdAt:now,updatedAt:now});
    await m.LeaveType.collection.insertMany([
      {_id:ids.annualType,organizationId:ids.organization,name:'Annual Leave',code:'AL',daysPerYear:12,status:'active',createdAt:now,updatedAt:now},
      {_id:ids.updateType,organizationId:ids.organization,name:'Update Leave',code:'UP',daysPerYear:5,status:'active',createdAt:now,updatedAt:now},
      {_id:ids.deleteType,organizationId:ids.organization,name:'Delete Leave',code:'DL',daysPerYear:3,status:'active',createdAt:now,updatedAt:now},
    ]);
    for(const employeeId of [ids.employee,ids.employee2])await m.LeaveBalance.collection.insertOne({_id:new mongoose.Types.ObjectId(),organizationId:ids.organization,employeeId,leaveTypeId:ids.annualType,cycleStartYear:2026,total:12,used:1,pending:0,remaining:11,createdAt:now,updatedAt:now});
    await m.Holiday.collection.insertMany([
      {_id:ids.holidayUpdate,organizationId:ids.organization,name:'Update Holiday',date:new Date('2026-12-24T00:00:00.000Z'),year:2026,status:'active',isDeleted:false,createdAt:now,updatedAt:now},
      {_id:ids.holidayDelete,organizationId:ids.organization,name:'Delete Holiday',date:new Date('2026-12-25T00:00:00.000Z'),year:2026,status:'active',isDeleted:false,createdAt:now,updatedAt:now},
    ]);
    await m.WeekOff.collection.insertOne({organizationId:ids.organization,shiftId:null,weekOffDays:[0],createdAt:now,updatedAt:now});
    await m.Shift.collection.insertMany([
      {_id:ids.shiftUpdate,organizationId:ids.organization,name:'Update Shift',code:'UPD',startTime:'09:00',endTime:'17:00',graceMinutes:0,status:'active',createdAt:now,updatedAt:now},
      {_id:ids.shiftDelete,organizationId:ids.organization,name:'Delete Shift',code:'DEL',startTime:'10:00',endTime:'18:00',graceMinutes:0,status:'active',createdAt:now,updatedAt:now},
    ]);
    await m.ApprovalFlow.collection.insertMany([
      {_id:ids.flowUpdate,organizationId:ids.organization,moduleKey:'leave',name:'Update Flow',isActive:false,minDays:1,maxDays:2,steps:[{stepNumber:1,approverType:'manager',roleSlug:null,employeeId:null}],createdAt:now,updatedAt:now},
      {_id:ids.flowDelete,organizationId:ids.organization,moduleKey:'attendance_request',name:'Delete Flow',isActive:true,minDays:6,maxDays:8,steps:[{stepNumber:1,approverType:'manager',roleSlug:null,employeeId:null}],createdAt:now,updatedAt:now},
    ]);
  };
  await seed(v1Connection);await seed(v2Connection);

  const v1Base=`http://127.0.0.1:${server.address().port}`;
  const pair=async(method,path,payload)=>{
    const headers={authorization:`Bearer ${token}`,...(payload!==undefined?{'content-type':'application/json'}:{})};
    const init={method,headers,...(payload!==undefined?{body:JSON.stringify(payload)}:{})};
    const expected=await readJson(await timeout(fetch(`${v1Base}/api/v1${path}`,{...init,signal:AbortSignal.timeout(8000)}),`V1 ${method} ${path}`));
    const result=await timeout(v2.app.inject({method,url:`/api/v2${path}`,headers,...(payload!==undefined?{payload}:{})}),`V2 ${method} ${path}`);
    const actual={status:result.statusCode,contentType:result.headers['content-type'],body:result.json()};
    assert.equal(actual.status,expected.status,`${method} ${path} status V1=${JSON.stringify(expected.body)} V2=${JSON.stringify(actual.body)}`);
    assert.equal(actual.contentType,expected.contentType,`${method} ${path} content-type`);
    assert.deepEqual(normalize(actual.body),normalize(expected.body),`${method} ${path} body`);
    return actual.body;
  };
  const persistedPair=async(label,query,project)=>{
    const [v1Rows,v2Rows]=await Promise.all([query(v1Models),query(v2Models)]);
    assert.deepEqual(normalize(project(v2Rows)),normalize(project(v1Rows)),`${label} persisted state`);
  };

  await t.test('personal leave balance and shift reads match against seeded employee data',async()=>{
    await pair('GET','/leave-balances/my');
    await pair('GET','/shifts/my');
  });
  await t.test('supporting-domain collection and employee reads match seeded V1 data',async()=>{
    for(const path of [
      '/leave-types/',
      `/leave-balances/employee/${ids.employee}`,
      '/holidays/',
      '/week-offs/',
      '/week-offs/all',
      '/shifts/',
      '/approval-flows/',
    ]) await pair('GET',path);
  });
  await t.test('leave types create/update/deactivate match response and stored records',async()=>{
    await pair('POST','/leave-types/',{name:'New Leave',code:'NL',daysPerYear:6,isCarryForward:false});
    await pair('PUT',`/leave-types/${ids.updateType}`,{name:'Updated Leave',daysPerYear:7});
    await pair('DELETE',`/leave-types/${ids.deleteType}`);
    await persistedPair('leave type writes',async models=>{const created=await models.LeaveType.findOne({organizationId:ids.organization,code:'NL'}).lean();return{created,updated:await models.LeaveType.findById(ids.updateType).lean(),deleted:await models.LeaveType.findById(ids.deleteType).lean(),credits:created?await models.LeaveBalance.find({organizationId:ids.organization,leaveTypeId:created._id}).lean():[]};},value=>value);
  });
  await t.test('employee and organization-wide leave balance adjustments match stored values',async()=>{
    await pair('POST',`/leave-balances/employee/${ids.employee}/adjust`,{leaveTypeId:String(ids.annualType),days:10,note:'single employee'});
    await pair('POST','/leave-balances/adjust-all',{leaveTypeId:String(ids.annualType),days:8,note:'organization adjustment'});
    await persistedPair('leave balance adjustments',models=>models.LeaveBalance.find({organizationId:ids.organization,leaveTypeId:ids.annualType}).sort({employeeId:1}).lean(),rows=>rows.map(({employeeId,total,used,pending,remaining,cycleStartYear})=>({employeeId,total,used,pending,remaining,cycleStartYear})));
  });
  await t.test('leave balance adjustments reject totals below used plus pending without mutating either database',async()=>{
    const snapshot=async models=>(await models.LeaveBalance.find({organizationId:ids.organization,leaveTypeId:ids.annualType}).sort({employeeId:1}).lean()).map(({employeeId,total,used,pending,remaining,cycleStartYear})=>({employeeId:String(employeeId),total,used,pending,remaining,cycleStartYear}));
    for(const [path,payload] of [
      [`/leave-balances/employee/${ids.employee}/adjust`,{leaveTypeId:String(ids.annualType),days:0.5,note:'must not lower below used leave'}],
      ['/leave-balances/adjust-all',{leaveTypeId:String(ids.annualType),days:0.5,note:'must not lower any employee below used leave'}],
    ]){
      const [beforeV1,beforeV2]=await Promise.all([snapshot(v1Models),snapshot(v2Models)]);
      const result=await pair('POST',path,payload);
      assert.equal(result.code,400,`${path} returns HTTP 400 contract`);
      assert.equal(result.data,null,`${path} has null error data`);
      assert.equal(result.error,null,`${path} has the legacy error field`);
      assert.match(result.message,/less than used \+ pending|remaining leave cannot be negative/i);
      assert.deepEqual(await snapshot(v1Models),beforeV1,`${path} leaves V1 balances unchanged`);
      assert.deepEqual(await snapshot(v2Models),beforeV2,`${path} leaves V2 balances unchanged`);
    }
  });
  await t.test('holiday create/update/delete match response and persisted soft-delete state',async()=>{
    await pair('POST','/holidays/',{name:'New Holiday',date:'2026-12-26T00:00:00.000Z'});
    await pair('PUT',`/holidays/${ids.holidayUpdate}`,{name:'Updated Holiday',status:'inactive'});
    await pair('DELETE',`/holidays/${ids.holidayDelete}`);
    await persistedPair('holiday writes',async models=>({created:await models.Holiday.collection.findOne({organizationId:ids.organization,name:'New Holiday'}),updated:await models.Holiday.collection.findOne({_id:ids.holidayUpdate}),deleted:await models.Holiday.collection.findOne({_id:ids.holidayDelete})}),value=>value);
  });
  await t.test('week-off upsert matches response and saved configuration',async()=>{
    await pair('POST','/week-offs/',{weekOffDays:[5,6]});
    await persistedPair('week-off upsert',models=>models.WeekOff.findOne({organizationId:ids.organization,shiftId:null}).lean(),row=>row);
  });
  await t.test('shift create/update/deactivate match responses and stored records',async()=>{
    await pair('POST','/shifts/',{name:'Night Shift',code:'NIGHT',startTime:'20:00',endTime:'04:00'});
    await pair('PUT',`/shifts/${ids.shiftUpdate}`,{name:'Updated Shift',graceMinutes:15});
    await pair('DELETE',`/shifts/${ids.shiftDelete}`);
    await persistedPair('shift writes',async models=>({created:await models.Shift.findOne({organizationId:ids.organization,code:'NIGHT'}).lean(),updated:await models.Shift.findById(ids.shiftUpdate).lean(),deleted:await models.Shift.findById(ids.shiftDelete).lean()}),value=>value);
  });
  await t.test('approval flow create/update/deactivate match responses and stored records',async()=>{
    const step={stepNumber:1,approverType:'manager'};
    await pair('POST','/approval-flows/',{moduleKey:'attendance_request',name:'New Attendance Flow',isActive:true,minDays:3,maxDays:5,steps:[step]});
    await pair('PUT',`/approval-flows/${ids.flowUpdate}`,{name:'Updated Flow',minDays:2,maxDays:3,steps:[step]});
    await pair('DELETE',`/approval-flows/${ids.flowDelete}`);
    await persistedPair('approval flow writes',async models=>({created:await models.ApprovalFlow.findOne({organizationId:ids.organization,name:'New Attendance Flow'}).lean(),updated:await models.ApprovalFlow.findById(ids.flowUpdate).lean(),deleted:await models.ApprovalFlow.findById(ids.flowDelete).lean()}),value=>value);
  });
});
