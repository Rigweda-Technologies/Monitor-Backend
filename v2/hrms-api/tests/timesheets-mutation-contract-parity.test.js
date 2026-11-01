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
import { createHolidayModels } from '../src/modules/holidays/holiday.models.js';
import { createWeekOffModels } from '../src/modules/week-offs/week-off.models.js';
import { createShiftModels } from '../src/modules/shifts/shift.models.js';
import { createApprovalFlowModels } from '../src/modules/approval-flows/approval-flow.models.js';
import { createLeaveModels } from '../src/modules/leaves/leave.models.js';
import { createLeaveTypeModels } from '../src/modules/leave-types/leave-type.models.js';
import { createTimesheetModels } from '../src/modules/timesheets/timesheet.models.js';
import { createTimesheetService } from '../src/modules/timesheets/timesheet.service.js';

const baseUri=process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const isolatedLocal=Boolean(baseUri)&&['localhost','127.0.0.1','::1'].includes(new URL(baseUri).hostname)&&/[_-](test|isolated|ci)([_-]|$)/i.test(new URL(baseUri).pathname);
const uriFor=suffix=>{const url=new URL(baseUri);url.pathname=`${url.pathname.replace(/\/$/,'')}_timesheet_mutations_${suffix}`;return url.toString();};
const timeout=(promise,label)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`Timed out waiting for ${label}`)),10000);})]).finally(()=>clearTimeout(timer));};
const modelsFor=connection=>({
  ...createEmployeeModels(connection),...createModels(connection),...createOrgSettingsModels(connection),...createDepartmentModels(connection),
  ...createHolidayModels(connection),...createWeekOffModels(connection),...createShiftModels(connection),...createApprovalFlowModels(connection),
  ...createLeaveModels(connection),...createLeaveTypeModels(connection),...createTimesheetModels(connection),
});
const permissions=['TIMESHEET_CHECKIN_SELF','TIMESHEET_CHECKOUT_SELF','TIMESHEET_VIEW_SELF','TIMESHEET_CREATE_SELF','TIMESHEET_EDIT_SELF','TIMESHEET_SUBMIT_SELF','TIMESHEET_RECALL_SELF','TIMESHEET_VIEW_ALL','TIMESHEET_ACTION','ATTENDANCE_VIEW_SELF','ATTENDANCE_VIEW_ALL','ATTENDANCE_MANAGE','TIMESHEET_VIEW_ONLINE'];
const normalize=value=>{
  if(value instanceof Date)return value.toISOString();
  if(value&&typeof value.toHexString==='function')return '<objectId>';
  if(Array.isArray(value))return value.map(normalize);
  if(!value||typeof value!=='object')return typeof value==='string'&&/^[a-f\d]{24}$/i.test(value)?'<objectId>':value;
  const source=value.toObject?value.toObject():value;
  return Object.fromEntries(Object.entries(source).filter(([key])=>!['_id','__v','createdAt','updatedAt','checkInAt','checkOutAt','submittedAt','actionAt','overriddenAt','missedCheckoutMarkedAt','at','totalMinutes','workHours'].includes(key)).map(([key,item])=>[key,normalize(item)]));
};
const readJson=async response=>({status:response.status,contentType:response.headers.get('content-type'),body:await response.json()});
const dateKeyInZone=(date,zone)=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}-${parts.find(p=>p.type==='day').value}`;};
const localStartOfDay=value=>{const date=new Date(value);date.setHours(0,0,0,0);return date;};
const weekStart=value=>{const date=localStartOfDay(value);date.setDate(date.getDate()-((date.getDay()-1+7)%7));return date;};
const plusDays=(value,days)=>{const date=new Date(value);date.setDate(date.getDate()+days);return date;};

test('V1/V2 timesheet successful attendance and workflow mutation parity',{skip:!baseUri},async t=>{
  assert.ok(isolatedLocal,'V2_HRMS_ISOLATED_TEST_DATABASE_URL must be local and use a test/isolated/ci database name');
  const secret='timesheet-mutation-parity-secret-0123456789';
  const ids={organization:new mongoose.Types.ObjectId(),user:new mongoose.Types.ObjectId(),role:new mongoose.Types.ObjectId(),employee:new mongoose.Types.ObjectId(),employee2:new mongoose.Types.ObjectId(),shift:new mongoose.Types.ObjectId(),leaveType:new mongoose.Types.ObjectId(),approvedLeave:new mongoose.Types.ObjectId(),recalledTimesheet:new mongoose.Types.ObjectId(),approvedTimesheet:new mongoose.Types.ObjectId()};
  const permissionIds=Object.fromEntries(permissions.map(code=>[code,new mongoose.Types.ObjectId()]));
  const token=jwt.sign({userId:ids.user,organizationId:ids.organization,activeRoleId:ids.role,roleIds:[ids.role]},secret,{expiresIn:'1h'});
  const identity={userId:ids.user,_id:ids.user,email:'timesheet-mutation@example.test',organizationId:ids.organization,activeRoleId:ids.role,rolePermissions:permissions};
  const v1Connection=await timeout(mongoose.createConnection(uriFor('v1'),{autoCreate:false,autoIndex:false}).asPromise(),'V1 Mongo');
  const v2Connection=await timeout(mongoose.createConnection(uriFor('v2'),{autoCreate:false,autoIndex:false}).asPromise(),'V2 Mongo');
  const v1Models=modelsFor(v1Connection);
  const config=loadConfig({MONGODB_URI:uriFor('v2'),JWT_SECRET:secret,BCRYPT_SALT_ROUNDS:'4'});
  const v2=await timeout(createRuntime({config,connection:v2Connection,logger:false,realtimeEnabled:false,sendOtp:async()=>{},verifySelfie:async()=>({confidence:99})}),'V2 runtime');
  const v2Models={...v2.employeeModels,...v2.orgSettingsModels,...v2.departmentModels,...v2.holidayModels,...v2.weekOffModels,...v2.shiftModels,...v2.approvalFlowModels,...v2.leaveModels,...v2.timesheetModels};
  const v2LockService=createTimesheetService({models:modelsFor(v2Connection),monitorRepository:{getAttendanceHours:async()=>new Map()},integrations:{audit:async()=>{},sendMail:async()=>true,createNotificationSafe:async()=>false,emitAttendanceUpdate:()=>{},compareAttendanceFaces:async()=>({confidence:99}),payrollAttendanceService:{listMonthlyAttendanceSnapshots:async()=>({count:0}),generateMonthlyAttendanceSnapshots:async()=>({generatedCount:0})}},policies:v2.timesheetPolicies});
  v2.timesheetService.lockAttendanceMonth=v2LockService.lockAttendanceMonth;

  const v1Auth=(req,res,next)=>{if(!req.headers.authorization)return res.status(401).json({success:false,code:401,message:'Authorization token missing',data:null,error:null});req.user={...identity};next();};
  const v1Authorize=required=>(req,res,next)=>{const allowed=Array.isArray(required)?required:[required];return allowed.some(code=>req.user.rolePermissions.includes(code))?next():res.status(403).json({success:false,code:403,message:`Permission denied: ${allowed.join(' | ')}`,data:null,error:null});};
  const v1=createLegacyRouterHarness({mounts:[{path:'/api/v1/timesheets',modulePath:'src/modules/timesheets/timesheet.routes.js'}],identity,environment:{NODE_ENV:'test'},overrides:{
    'src/middlewares/auth.middleware.js':v1Auth,'src/middlewares/authorize.middleware.js':v1Authorize,
    'src/modules/organizations/organization.model.js':v1Models.Organization,'src/modules/employees/employee.model.js':v1Models.Employee,
    'src/modules/roles/role.model.js':v1Models.Role,'src/modules/permissions/permission.model.js':v1Models.Permission,'src/modules/users/user.model.js':v1Models.User,
    'src/modules/orgSettings/orgSettings.model.js':v1Models.OrgSettings,'src/modules/timesheets/timesheet.model.js':v1Models.Timesheet,
    'src/modules/timesheets/timesheetAttendance.model.js':v1Models.Attendance,'src/modules/timesheets/attendanceRequest.model.js':v1Models.AttendanceRequest,
    'src/modules/auditLogs/auditLogs.model.js':v1Models.AuditLog,
    'src/modules/leaves/leave.model.js':v1Models.Leave,'src/modules/holidays/holiday.model.js':v1Models.Holiday,
    'src/modules/leaveTypes/leaveType.model.js':v1Models.LeaveType,
    'src/modules/weekOffs/weekOff.model.js':v1Models.WeekOff,'src/modules/shifts/shift.model.js':v1Models.Shift,
    'src/modules/approvalFlows/approvalFlow.model.js':v1Models.ApprovalFlow,'src/modules/auditLogs/auditLogs.service.js':{audit:async()=>{}},
    'src/modules/organizations/org-user.model.js':v1Models.Membership,
    'src/modules/notifications/notification.service.js':{createNotificationSafe:async()=>false},
    'src/modules/payroll/payrollAttendance.service.js':{listMonthlyAttendanceSnapshots:async()=>({count:0}),generateMonthlyAttendanceSnapshots:async()=>({generatedCount:0})},
    'src/config/monitorDb.js':{getMonitorPgPool:async()=>({query:async()=>({rows:[]})})},'src/realtime/socket.js':{emitAttendanceUpdate:()=>{}},
  }});
  const server=v1.listen(0,'127.0.0.1');await timeout(new Promise(resolve=>server.once('listening',resolve)),'V1 listen');
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await v2.close();await v1Connection.dropDatabase();await v2Connection.dropDatabase();await v1Connection.close();await v2Connection.close();});

  const now=new Date();const todayKey=dateKeyInZone(now,'Asia/Kolkata');const overrideDate=dateKeyInZone(plusDays(now,-1),'Asia/Kolkata');const customOverrideDate=dateKeyInZone(plusDays(now,-2),'Asia/Kolkata');const thisMonthFirstMonday=weekStart(new Date(now.getFullYear(),now.getMonth(),1));
  const currentLastWeek=weekStart(now);currentLastWeek.setDate(currentLastWeek.getDate()-7);
  const submitWeekStart=thisMonthFirstMonday.getTime()===currentLastWeek.getTime()?plusDays(thisMonthFirstMonday,7):thisMonthFirstMonday;
  const submitWeekEnd=plusDays(submitWeekStart,6);const lastWeekEnd=plusDays(currentLastWeek,6);
  const createWeekStart=plusDays(submitWeekStart,14);const createWeekEnd=plusDays(createWeekStart,6);
  const seed=async connection=>{
    const m=modelsFor(connection),createdAt=new Date('2026-10-01T00:00:00.000Z');
    await m.Organization.collection.insertOne({_id:ids.organization,name:'Timesheet Parity Org',code:'TS-PARITY',timezone:'Asia/Kolkata',currency:'INR',status:'active',leaveCycleStartMonth:1,createdAt,updatedAt:createdAt});
    await m.User.collection.insertOne({_id:ids.user,email:identity.email,password:'synthetic',organizationIds:[ids.organization],activeOrganizationId:ids.organization,tokenList:[{token,organizationId:ids.organization,status:'active',loginTimestamp:createdAt.toISOString()}],status:'active',createdAt,updatedAt:createdAt});
    await m.Permission.collection.insertMany(Object.entries(permissionIds).map(([code,_id])=>({_id,organizationId:ids.organization,code,name:code,createdAt,updatedAt:createdAt})));
    await m.Role.collection.insertOne({_id:ids.role,organizationId:ids.organization,name:'Admin',slug:'admin',permissionIds:Object.values(permissionIds),isSystemRole:false,status:'active',createdAt,updatedAt:createdAt});
    await m.Membership.collection.insertOne({userId:ids.user,organizationId:ids.organization,roleIds:[ids.role],createdAt,updatedAt:createdAt});
    await m.Employee.collection.insertMany([
      {_id:ids.employee,organizationId:ids.organization,userId:ids.user,firstName:'Casey',lastName:'Timesheet',employeeCode:'E-TS-1',dateOfJoining:createdAt,employmentType:'full_time',employmentLifecycleStatus:'confirmed',status:'active',isDeleted:false,shiftId:ids.shift,createdAt,updatedAt:createdAt},
      {_id:ids.employee2,organizationId:ids.organization,userId:new mongoose.Types.ObjectId(),firstName:'Jordan',lastName:'Timesheet',employeeCode:'E-TS-2',dateOfJoining:createdAt,employmentType:'full_time',employmentLifecycleStatus:'confirmed',status:'active',isDeleted:false,shiftId:ids.shift,createdAt,updatedAt:createdAt},
    ]);
    await m.OrgSettings.collection.insertOne({organizationId:ids.organization,timezone:'Asia/Kolkata',attendanceHoursSource:'manual',attendanceLockEnabled:true,attendanceLockAfterDays:7,attendanceLockMode:'days_window',attendanceSelfieRequired:false,attendanceIpEnabled:false,attendanceMultiPunchEnabled:false,attendanceGeoFenceEnabled:false,attendanceDevBypassEnabled:false,minWorkHoursPerDay:8,minHalfDayHours:4,createdAt,updatedAt:createdAt});
    await m.Shift.collection.insertOne({_id:ids.shift,organizationId:ids.organization,name:'All Day Shift',code:'ALLDAY',startTime:'00:00',endTime:'23:59',graceMinutes:0,status:'active',createdAt,updatedAt:createdAt});
    await m.WeekOff.collection.insertOne({organizationId:ids.organization,shiftId:null,weekOffDays:[],createdAt,updatedAt:createdAt});
    await m.LeaveType.collection.insertOne({_id:ids.leaveType,organizationId:ids.organization,name:'Annual Leave',code:'AL',daysPerYear:12,status:'active',createdAt,updatedAt:createdAt});
    await m.Leave.collection.insertOne({_id:ids.approvedLeave,organizationId:ids.organization,employeeId:ids.employee2,leaveTypeId:ids.leaveType,fromDate:localStartOfDay(now),toDate:localStartOfDay(now),duration:'full_day',totalDays:1,reason:'Timesheet on-leave parity fixture',status:'approved',isDeleted:false,createdAt,updatedAt:createdAt});
    await m.Attendance.collection.insertOne({_id:new mongoose.Types.ObjectId(),organizationId:ids.organization,employeeId:ids.employee,date:new Date('2026-09-15T00:00:00.000Z'),dateKey:'2026-09-15',checkInAt:new Date('2026-09-15T08:00:00.000Z'),checkOutAt:null,status:'checked_in',attendanceSource:'manual',createdAt,updatedAt:createdAt});
    await m.Timesheet.collection.insertOne({_id:ids.recalledTimesheet,organizationId:ids.organization,employeeId:ids.employee,weekStart:currentLastWeek,weekEnd:lastWeekEnd,entries:[{date:currentLastWeek,hours:8,notes:'approved prior week'}],totalHours:8,status:'approved',createdAt,updatedAt:createdAt});
  };
  await seed(v1Connection);await seed(v2Connection);

  const v1Base=`http://127.0.0.1:${server.address().port}`;
  const pair=async({method,path,payload,pathV1=path,pathV2=path})=>{
    const headers={authorization:`Bearer ${token}`,...(payload!==undefined?{'content-type':'application/json'}:{})};
    const init={method,headers,...(payload!==undefined?{body:JSON.stringify(payload)}:{})};
    let expected;
    try { expected=await readJson(await timeout(fetch(`${v1Base}/api/v1/timesheets${pathV1}`,{...init,signal:AbortSignal.timeout(15000)}),`V1 ${method} ${pathV1}`)); }
    catch(error) { error.message=`V1 ${method} ${pathV1}: ${error.message}`; throw error; }
    let result;
    try { result=await timeout(v2.app.inject({method,url:`/api/v2/timesheets${pathV2}`,headers,...(payload!==undefined?{payload}:{})}),`V2 ${method} ${pathV2}`); }
    catch(error) { error.message=`V2 ${method} ${pathV2}: ${error.message}`; throw error; }
    const actual={status:result.statusCode,contentType:result.headers['content-type'],body:result.json()};
    assert.equal(actual.status,expected.status,`${method} ${path} status V1=${JSON.stringify(expected.body)} V2=${JSON.stringify(actual.body)}`);
    assert.equal(actual.contentType,expected.contentType,`${method} ${path} content-type`);
    assert.deepEqual(normalize(actual.body),normalize(expected.body),`${method} ${path} body`);
    return {v1:expected.body,v2:actual.body};
  };
  const persisted=async(label,query,project)=>{
    const [left,right]=await Promise.all([query(v1Models),query(v2Models)]);
    assert.deepEqual(normalize(project(left)),normalize(project(right)),`${label} persisted state`);
  };

  await t.test('check-in and check-out responses and attendance state match',async()=>{
    await pair({method:'POST',path:'/check-in',payload:{deviceId:'synthetic-device'}});
    const onlineAfterCheckIn=await pair({method:'GET',path:'/online'});
    assert.equal(onlineAfterCheckIn.v1.data.length,1,'checked-in employee appears in online attendance');
    const checkedIn=async models=>models.Attendance.findOne({organizationId:ids.organization,employeeId:ids.employee,dateKey:todayKey}).lean();
    await persisted('check-in',checkedIn,row=>({dateKey:row?.dateKey,status:row?.status,checkInDeviceId:row?.checkInDeviceId,attendanceSource:row?.attendanceSource,shiftCode:row?.shiftCode}));
    await pair({method:'POST',path:'/check-out',payload:{deviceId:'synthetic-device'}});
    const onlineAfterCheckOut=await pair({method:'GET',path:'/online'});
    assert.equal(onlineAfterCheckOut.v1.data.length,0,'checked-out employee is removed from online attendance');
    await persisted('check-out',checkedIn,row=>({dateKey:row?.dateKey,status:row?.status,checkInDeviceId:row?.checkInDeviceId,checkOutDeviceId:row?.checkOutDeviceId,attendanceSource:row?.attendanceSource,shiftCode:row?.shiftCode}));
  });
  await t.test('attendance, request, and weekly list reads match after seeded workflows',async()=>{
    for(const path of [
      `/attendance/my?date=${todayKey}`,
      `/attendance?date=${todayKey}`,
      `/attendance/matrix?month=${todayKey.slice(0,7)}`,
      `/attendance/matrix/my?month=${todayKey.slice(0,7)}`,
      '/attendance/matrix/history?employeeId='+ids.employee+'&date=2026-09-15',
      '/attendance/matrix/history/my?date=2026-09-15',
      '/attendance/requests/defaults/my?date='+todayKey,
      '/attendance/requests/my',
      '/attendance/requests',
      '/attendance/requests/pending/my-approvals',
      '/weekly',
      '/weekly/my',
    ]) await pair({method:'GET',path});
  });
  await t.test('on-leave listing returns the approved current-day leave with populated employee and leave type',async()=>{
    const response=await pair({method:'GET',path:'/on-leave'});
    assert.equal(response.v1.data.length,1);
    assert.equal(String(response.v1.data[0].employeeId.employeeCode),'E-TS-2');
    assert.equal(String(response.v1.data[0].leaveTypeId.code),'AL');
  });
  await t.test('single, bulk, and custom attendance overrides preserve responses and stored state',async()=>{
    await pair({method:'PUT',path:'/attendance/matrix/:employeeId',pathV1:`/attendance/matrix/${ids.employee}`,pathV2:`/attendance/matrix/${ids.employee}`,payload:{date:overrideDate,status:'present'}});
    await pair({method:'POST',path:'/attendance/matrix/bulk',payload:{date:overrideDate,status:'absent',employeeIds:[String(ids.employee2)]}});
    await pair({method:'POST',path:'/attendance/matrix/custom-bulk',payload:{updates:[{employeeId:String(ids.employee),date:customOverrideDate,status:'absent'}]}});
    for(const [employeeId,dateKey,status] of [[ids.employee,overrideDate,'present'],[ids.employee2,overrideDate,'absent'],[ids.employee,customOverrideDate,'absent']]){
      const query=async models=>models.Attendance.findOne({organizationId:ids.organization,employeeId,dateKey}).lean();
      await persisted(`attendance override ${employeeId} ${dateKey}`,query,row=>({dateKey:row?.dateKey,status:row?.status,attendanceSource:row?.attendanceSource,overriddenBy:row?.overriddenBy}));
    }
    await pair({method:'POST',path:'/attendance/matrix/lock-month',payload:{month:'2026-09'}});
  });
  await t.test('attendance request submit and reject action match responses and stored state',async()=>{
    const submitted=await pair({method:'POST',path:'/attendance/requests/my',payload:{date:todayKey,requestType:'correction',requestedCheckOutTime:'17:00',reason:'Correct checkout time'}});
    const v1Id=submitted.v1.data?._id;const v2Id=submitted.v2.data?._id;
    assert.ok(v1Id&&v2Id,'both APIs should return their created attendance request IDs');
    await pair({method:'PUT',path:'/attendance/requests/:id/action',pathV1:`/attendance/requests/${v1Id}/action`,pathV2:`/attendance/requests/${v2Id}/action`,payload:{status:'rejected',rejectionReason:'Request details need correction'}});
    await persisted('attendance request action',models=>models.AttendanceRequest.findOne({organizationId:ids.organization,employeeId:ids.employee,date:todayKey}).lean(),row=>({date:row?.date,requestType:row?.requestType,requestedCheckOutTime:row?.requestedCheckOutTime,status:row?.status,rejectionReason:row?.rejectionReason}));
  });
  await t.test('weekly create submit and approval match responses and persisted state',async()=>{
    const created=await pair({method:'POST',path:'/weekly',payload:{weekStart:createWeekStart.toISOString(),entries:[{date:createWeekStart.toISOString(),hours:8,notes:'weekly parity entry'}]}});
    const v1Created=await v1Models.Timesheet.findOne({organizationId:ids.organization,employeeId:ids.employee,weekStart:createWeekStart}).lean();
    const v2Created=await v2Models.Timesheet.findOne({organizationId:ids.organization,employeeId:ids.employee,weekStart:createWeekStart}).lean();
    const v1Id=v1Created?._id?.toString();const v2Id=v2Created?._id?.toString();
    assert.ok(v1Id&&v2Id,`both APIs should return created timesheet IDs; V1=${JSON.stringify(created.v1)} V2=${JSON.stringify(created.v2)}`);
    await pair({method:'PUT',path:'/weekly/:id',pathV1:`/weekly/${v1Id}`,pathV2:`/weekly/${v2Id}`,payload:{entries:[{date:createWeekStart.toISOString(),hours:7.5,notes:'updated parity entry'}]}});
    await pair({method:'POST',path:'/weekly/:id/submit',pathV1:`/weekly/${v1Id}/submit`,pathV2:`/weekly/${v2Id}/submit`,payload:{}});
    await pair({method:'PUT',path:'/weekly/:id/action',pathV1:`/weekly/${v1Id}/action`,pathV2:`/weekly/${v2Id}/action`,payload:{status:'approved'}});
    const sheet=async models=>models.Timesheet.findOne({organizationId:ids.organization,employeeId:ids.employee,weekStart:createWeekStart}).lean();
    await persisted('weekly submission/approval',sheet,row=>({weekStart:row?.weekStart,weekEnd:row?.weekEnd,status:row?.status,totalHours:row?.totalHours,entries:row?.entries?.map(({date,hours,notes})=>({date,hours,notes}))}));
  });
  await t.test('last-week approved timesheet recall matches response and persisted state',async()=>{
    await pair({method:'POST',path:'/weekly/:id/recall',pathV1:`/weekly/${ids.recalledTimesheet}/recall`,pathV2:`/weekly/${ids.recalledTimesheet}/recall`});
    await persisted('weekly recall',models=>models.Timesheet.findById(ids.recalledTimesheet).lean(),row=>({status:row?.status,actionBy:row?.actionBy,weekStart:row?.weekStart,totalHours:row?.totalHours}));
  });
});
