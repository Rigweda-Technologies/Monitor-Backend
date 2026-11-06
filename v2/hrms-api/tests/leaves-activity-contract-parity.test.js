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
import { createLeaveModels } from '../src/modules/leaves/leave.models.js';
import { createActivityService } from '../src/modules/activity/activity.service.js';

const baseUri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const isolatedLocal = Boolean(baseUri) && ['localhost','127.0.0.1','::1'].includes(new URL(baseUri).hostname) && /[_-](test|isolated|ci)([_-]|$)/i.test(new URL(baseUri).pathname);
const uriFor = suffix => { const url = new URL(baseUri); url.pathname = `${url.pathname.replace(/\/$/,'')}_leaves_activity_${suffix}`; return url.toString(); };
const timeout = (promise,label) => { let timer; return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`Timed out waiting for ${label}`)),10000);})]).finally(()=>clearTimeout(timer)); };
const modelsFor = connection => ({
  ...createEmployeeModels(connection), ...createModels(connection), ...createDepartmentModels(connection), ...createOrgSettingsModels(connection),
  ...createLeaveTypeModels(connection), ...createLeaveBalanceModels(connection), ...createHolidayModels(connection),
  ...createWeekOffModels(connection), ...createShiftModels(connection), ...createApprovalFlowModels(connection), ...createLeaveModels(connection),
});
const leaveRoutes = [
  ['POST','/apply','LEAVE_APPLY',{ }], ['GET','/my','LEAVE_VIEW_SELF'], ['GET','/my-range','LEAVE_VIEW_SELF'], ['GET','/apply-context','LEAVE_APPLY'],
  ['GET','/','LEAVE_VIEW_ALL'], ['GET','/pending/my-approvals','LEAVE_ACTION'], ['PUT','/000000000000000000000001/action','LEAVE_ACTION',{}],
  ['POST','/000000000000000000000001/revert-request','LEAVE_VIEW_SELF',{}], ['PUT','/000000000000000000000001/revert-request/action','LEAVE_ACTION',{}],
];
const activityRoutes = ['/laptop-health','/employees','/apps','/app-key-usage','/browser-history'];
const readJson = async response => ({status:response.status,contentType:response.headers.get('content-type'),body:await response.json()});
const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key])=>!['_id','createdAt','updatedAt','requestedAt','actionAt'].includes(key)).map(([key,item])=>[key,stable(item)]));
};

test('V1/V2 leaves and activity route contract parity using isolated Mongo and injected monitor rows',{skip:!baseUri},async t=>{
  assert.ok(isolatedLocal,'V2_HRMS_ISOLATED_TEST_DATABASE_URL must be local and use a test/isolated/ci database name');
  const secret='leaves-activity-parity-test-secret-123456789';
  const ids={organization:new mongoose.Types.ObjectId(),foreignOrganization:new mongoose.Types.ObjectId(),user:new mongoose.Types.ObjectId(),role:new mongoose.Types.ObjectId(),employee:new mongoose.Types.ObjectId(),leaveType:new mongoose.Types.ObjectId(),leaveBalance:new mongoose.Types.ObjectId(),shift:new mongoose.Types.ObjectId(),approvedLeave:new mongoose.Types.ObjectId(),pendingLeave:new mongoose.Types.ObjectId(),rejectedLeave:new mongoose.Types.ObjectId(),foreignLeave:new mongoose.Types.ObjectId()};
  const permissions=['LEAVE_APPLY','LEAVE_VIEW_SELF','LEAVE_VIEW_ALL','LEAVE_ACTION','EMP_VIEW'];
  const permissionIds=Object.fromEntries(permissions.map(code=>[code,new mongoose.Types.ObjectId()]));
  const token=jwt.sign({userId:ids.user,organizationId:ids.organization,activeRoleId:ids.role,roleIds:[ids.role]},secret,{expiresIn:'1h'});
  const identity={userId:ids.user,_id:ids.user,email:'leave-employee@example.test',organizationId:ids.organization,activeRoleId:ids.role,rolePermissions:permissions};
  const v1Connection=await timeout(mongoose.createConnection(uriFor('v1'),{autoCreate:false,autoIndex:false}).asPromise(),'V1 Mongo');
  const v2Connection=await timeout(mongoose.createConnection(uriFor('v2'),{autoCreate:false,autoIndex:false}).asPromise(),'V2 Mongo');
  const v1Models=modelsFor(v1Connection);
  const config=loadConfig({MONGODB_URI:uriFor('v2'),JWT_SECRET:secret,BCRYPT_SALT_ROUNDS:'4'});
  const v2=await timeout(createRuntime({config,connection:v2Connection,logger:false,realtimeEnabled:false,sendOtp:async()=>{},verifySelfie:async()=>({confidence:99})}),'V2 runtime');

  const monitorAt=new Date(Date.now()-10*60*1000);
  const monitorDayParts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(monitorAt);
  const monitorDay=`${monitorDayParts.find(part=>part.type==='year').value}-${monitorDayParts.find(part=>part.type==='month').value}-${monitorDayParts.find(part=>part.type==='day').value}`;
  const sessionStart=new Date(monitorAt.getTime()-2*60*1000);
  const eventRows=[{employeeId:String(ids.employee),employeeName:'Casey Employee',status:'active',activityDate:monitorDay,observedAt:monitorAt,activeSeconds:120,idleSeconds:5}];
  const sessionRows=[{employeeId:String(ids.employee),employeeName:'Casey Employee',startedAt:sessionStart,endedAt:monitorAt,activeSeconds:120}];
  const appRows=[{employeeId:String(ids.employee),employeeName:'Casey Employee',appNameKey:'chrome',appName:'Chrome',processNameKey:'chrome.exe',processName:'chrome.exe',totalSeconds:120,keyPressCount:2,sessionCount:1}];
  const detailedSessions=[{sessionId:'session-1',employeeId:String(ids.employee),deviceId:'device-1',appName:'Chrome',processName:'chrome.exe',observedAt:monitorAt,startedAt:sessionStart,endedAt:monitorAt,activeSeconds:120,keyPressCount:2,keyNames:['A','B'],typedText:'ab',keyStreamText:'ab'}];
  const keyRows=[{employeeId:String(ids.employee),employeeName:'Casey Employee',appName:'Chrome',processName:'chrome.exe',activeSeconds:120,keyPressCount:2,keyNames:['A','B'],typedText:'ab',keyStreamText:'ab'}];
  const browserRows=[{entryId:'entry-1',employeeId:String(ids.employee),employeeName:'Casey Employee',deviceId:'device-1',observedAt:monitorAt,browser:'Chrome',url:'https://example.test',title:'Example',activeWindowTitle:'Example',durationMs:5000}];
  const healthRows=[{id:'health-1',organizationId:String(ids.organization),employeeId:String(ids.employee),employee:{id:String(ids.employee),name:'Casey Employee',code:'E-LEAVE-1'},deviceId:'device-1',hostname:'casey-laptop',platform:'Windows',platformVersion:'11',agentVersion:'2.0.0',cpuModel:'Example CPU',cpuCoreCount:8,cpuPercent:22.5,memoryTotalBytes:16000,memoryUsedBytes:8000,memoryPercent:50,disks:[{mount:'C:',filesystem:'NTFS',totalBytes:1000,usedBytes:500,freeBytes:500,usedPercent:50}],temperatureC:42,batteryPercent:90,batteryCharging:true,uptimeSeconds:3600,lastSeenAt:monitorAt,reportedAt:monitorAt,createdAt:monitorAt,updatedAt:monitorAt}];
  const queryMonitor={query:async(sql)=>{
    const text=String(sql).replace(/\s+/g,' ').toLowerCase();
    if(text.includes('monitor_activity_events'))return{rows:eventRows};
    if(text.includes('monitor_browser_history'))return{rows:text.includes('count(*)')?[{total:browserRows.length}]:browserRows};
    if(text.includes('monitor_app_usage_sessions')){
      if(text.includes('group by'))return{rows:appRows};
      if(text.includes('count(*)'))return{rows:[{total:appRows.length}]};
      if(text.includes('session_id'))return{rows:detailedSessions};
      if(text.includes('key_press_count'))return{rows:keyRows};
      return{rows:sessionRows};
    }
    return{rows:[]};
  }};
  const fakeMonitorRepository={
    listLaptopHealthRows:async()=>healthRows.map(row=>({...row,employeeName:row.employee.name,employeeCode:row.employee.code})),listEmployeeActivityRows:async()=>({activityRows:eventRows,sessionRows}),
    listAppUsageRows:async()=>({appRows,countRows:[{total:appRows.length}],sessionRows:detailedSessions}),listAppKeyUsageRows:async()=>keyRows,
    listBrowserHistoryRows:async()=>({rows:browserRows,countRows:[{total:browserRows.length}]})
  };
  Object.assign(v2.activityService,createActivityService({models:{Employee:v2.employeeModels.Employee,OrgSettings:v2.orgSettingsModels.OrgSettings,Organization:v2.connection.models.organizations},repository:fakeMonitorRepository}));

  const v1Auth=(req,res,next)=>{if(!req.headers.authorization)return res.status(401).json({success:false,code:401,message:'Authorization token missing',data:null,error:null});req.user={...identity};next();};
  const v1Authorize=required=>(req,res,next)=>{const allowed=Array.isArray(required)?required:[required];return allowed.some(code=>req.user.rolePermissions.includes(code))?next():res.status(403).json({success:false,code:403,message:`Permission denied: ${allowed.join(' | ')}`,data:null,error:null});};
  const v1=createLegacyRouterHarness({mounts:[{path:'/api/v1/leaves',modulePath:'src/modules/leaves/leave.routes.js'},{path:'/api/v1/activity',modulePath:'src/modules/activity/activity.routes.js'}],identity,environment:{NODE_ENV:'test'},sendMail:async()=>true,overrides:{
    'src/middlewares/auth.middleware.js':v1Auth,'src/middlewares/authorize.middleware.js':v1Authorize,
    'src/modules/organizations/organization.model.js':v1Models.Organization,'src/modules/employees/employee.model.js':v1Models.Employee,
    'src/modules/roles/role.model.js':v1Models.Role,'src/modules/permissions/permission.model.js':v1Models.Permission,'src/modules/users/user.model.js':v1Models.User,
    'src/modules/orgSettings/orgSettings.model.js':v1Models.OrgSettings,'src/modules/leaves/leave.model.js':v1Models.Leave,
    'src/modules/leaveTypes/leaveType.model.js':v1Models.LeaveType,'src/modules/leaveBalances/leaveBalance.model.js':v1Models.LeaveBalance,
    'src/modules/holidays/holiday.model.js':v1Models.Holiday,'src/modules/weekOffs/weekOff.model.js':v1Models.WeekOff,
    'src/modules/shifts/shift.model.js':v1Models.Shift,'src/modules/approvalFlows/approvalFlow.model.js':v1Models.ApprovalFlow,
    'src/modules/auditLogs/auditLogs.service.js':{audit:async()=>{}},'src/modules/notifications/notification.service.js':{createNotificationSafe:async()=>false},
    'src/config/monitorDb.js':{getMonitorPgPool:async()=>queryMonitor},'src/modules/agent/agent.health.service.js':{listHealth:async()=>healthRows},
  }});
  const server=v1.listen(0,'127.0.0.1'); await timeout(new Promise(resolve=>server.once('listening',resolve)),'V1 listen');
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await v2.close();await v1Connection.dropDatabase();await v2Connection.dropDatabase();await v1Connection.close();await v2Connection.close();});

  const seed=async connection=>{
    const m=modelsFor(connection),now=new Date('2026-10-01T00:00:00.000Z');
    await m.Organization.collection.insertOne({_id:ids.organization,name:'Leave Parity Org',code:'LEAVE-PARITY',timezone:'Asia/Kolkata',currency:'INR',status:'active',leaveCycleStartMonth:1,createdAt:now,updatedAt:now});
    await m.User.collection.insertOne({_id:ids.user,email:identity.email,password:'synthetic',organizationIds:[ids.organization],activeOrganizationId:ids.organization,activeRoleSlug:'admin',tokenList:[{token,organizationId:ids.organization,status:'active',loginTimestamp:now.toISOString()}],status:'active',createdAt:now,updatedAt:now});
    await m.Permission.collection.insertMany(Object.entries(permissionIds).map(([code,_id])=>({_id,organizationId:ids.organization,code,name:code,createdAt:now,updatedAt:now})));
    await m.Role.collection.insertOne({_id:ids.role,organizationId:ids.organization,name:'Admin',slug:'admin',permissionIds:Object.values(permissionIds),isSystemRole:false,status:'active',createdAt:now,updatedAt:now});
    await m.Membership.collection.insertOne({userId:ids.user,organizationId:ids.organization,roleIds:[ids.role],createdAt:now,updatedAt:now});
    await m.Employee.collection.insertOne({_id:ids.employee,organizationId:ids.organization,userId:ids.user,firstName:'Casey',lastName:'Employee',employeeCode:'E-LEAVE-1',dateOfJoining:now,employmentType:'full_time',employmentLifecycleStatus:'confirmed',status:'active',isDeleted:false,shiftId:ids.shift,createdAt:now,updatedAt:now});
    await m.OrgSettings.collection.insertOne({organizationId:ids.organization,timezone:'Asia/Kolkata',attendanceLockEnabled:false,attendanceLockMode:'days_window',sandwichRuleEnabled:false,leaveCreditFrequency:'monthly',createdAt:now,updatedAt:now});
    await m.LeaveType.collection.insertOne({_id:ids.leaveType,organizationId:ids.organization,name:'Annual Leave',code:'AL',daysPerYear:12,isCarryForward:false,status:'active',createdAt:now,updatedAt:now});
    await m.LeaveBalance.collection.insertOne({_id:ids.leaveBalance,organizationId:ids.organization,employeeId:ids.employee,leaveTypeId:ids.leaveType,cycleStartYear:2026,total:12,used:1,pending:1,remaining:10,createdAt:now,updatedAt:now});
    await m.Shift.collection.insertOne({_id:ids.shift,organizationId:ids.organization,name:'Day Shift',code:'DAY',startTime:'09:00',endTime:'17:00',status:'active',createdAt:now,updatedAt:now});
    await m.WeekOff.collection.insertOne({organizationId:ids.organization,shiftId:null,weekOffDays:[0],createdAt:now,updatedAt:now});
    await m.Leave.collection.insertOne({_id:ids.approvedLeave,organizationId:ids.organization,employeeId:ids.employee,leaveTypeId:ids.leaveType,fromDate:new Date('2026-11-12T00:00:00.000Z'),toDate:new Date('2026-11-12T23:59:59.999Z'),duration:'full_day',totalDays:1,effectiveDateKeys:['2026-11-12'],reason:'seeded approved leave',status:'approved',approvalSteps:[],isDeleted:false,createdAt:now,updatedAt:now});
    await m.Leave.collection.insertOne({_id:ids.pendingLeave,organizationId:ids.organization,employeeId:ids.employee,leaveTypeId:ids.leaveType,fromDate:new Date('2026-11-05T00:00:00.000Z'),toDate:new Date('2026-11-05T23:59:59.999Z'),duration:'full_day',totalDays:1,effectiveDateKeys:['2026-11-05'],reason:'seeded pending leave',status:'pending',approvalSteps:[],isDeleted:false,createdAt:now,updatedAt:now});
    await m.Leave.collection.insertOne({_id:ids.rejectedLeave,organizationId:ids.organization,employeeId:ids.employee,leaveTypeId:ids.leaveType,fromDate:new Date('2026-11-06T00:00:00.000Z'),toDate:new Date('2026-11-06T23:59:59.999Z'),duration:'full_day',totalDays:1,effectiveDateKeys:['2026-11-06'],reason:'seeded leave for rejection',status:'pending',approvalSteps:[],isDeleted:false,createdAt:now,updatedAt:now});
    await m.Leave.collection.insertOne({_id:ids.foreignLeave,organizationId:ids.foreignOrganization,employeeId:new mongoose.Types.ObjectId(),leaveTypeId:new mongoose.Types.ObjectId(),fromDate:new Date('2026-11-07T00:00:00.000Z'),toDate:new Date('2026-11-07T23:59:59.999Z'),duration:'full_day',totalDays:1,effectiveDateKeys:['2026-11-07'],reason:'foreign tenant leave',status:'pending',approvalSteps:[],isDeleted:false,createdAt:now,updatedAt:now});
  };
  await seed(v1Connection);await seed(v2Connection);

  const v1Base=`http://127.0.0.1:${server.address().port}`;
  const pair=async({method,path,payload,auth=true,compareBody=true})=>{
    const headers={...(auth?{authorization:`Bearer ${token}`}:{})};if(payload!==undefined)headers['content-type']='application/json';
    const init={method,headers,...(payload!==undefined?{body:JSON.stringify(payload)}:{})};
    const expected=await readJson(await timeout(fetch(`${v1Base}/api/v1${path}`,{...init,signal:AbortSignal.timeout(8000)}),`V1 ${method} ${path}`));
    const actualResponse=await timeout(v2.app.inject({method,url:`/api/v2${path}`,headers,...(payload!==undefined?{payload}:{})}),`V2 ${method} ${path}`);
    const actual={status:actualResponse.statusCode,contentType:actualResponse.headers['content-type'],body:actualResponse.json()};
    assert.equal(actual.status,expected.status,`${method} ${path} status V1=${JSON.stringify(expected.body)} V2=${JSON.stringify(actual.body)}`);
    assert.equal(actual.contentType,expected.contentType,`${method} ${path} content type`);
    if(compareBody)assert.deepEqual(stable(actual.body),stable(expected.body),`${method} ${path} body`);
    return {v1:expected.body,v2:actual.body};
  };

  await t.test('all 14 route auth gates match missing-auth status/body/content type',async()=>{
    assert.equal(leaveRoutes.length+activityRoutes.length,14);
    for(const [method,path] of leaveRoutes)await pair({method,path:`/leaves${path}`,auth:false});
    for(const path of activityRoutes)await pair({method:'GET',path:`/activity${path}`,auth:false});
  });
  await t.test('all four leave request validators match invalid-input response',async()=>{
    const examples=[['POST','/leaves/apply',{}],['PUT','/leaves/000000000000000000000001/action',{}],['POST','/leaves/000000000000000000000001/revert-request',{}],['PUT','/leaves/000000000000000000000001/revert-request/action',{}]];
    for(const [method,path,payload] of examples)await pair({method,path,payload});
  });
  await t.test('representative leave reads and an apply write match actual service results',async()=>{
    for(const path of ['/leaves/my','/leaves/my-range?startDate=2026-11-01&endDate=2026-11-30','/leaves/apply-context','/leaves/','/leaves/pending/my-approvals'])await pair({method:'GET',path});
    await pair({method:'POST',path:'/leaves/apply',payload:{leaveTypeId:String(ids.leaveType),fromDate:'2026-11-04',toDate:'2026-11-04',reason:'Personal appointment'}});
  });
  await t.test('approval and reversal writes match responses and persisted balance transitions',async()=>{
    const balanceState=async models=>{
      const balance=await models.LeaveBalance.findOne({_id:ids.leaveBalance}).lean();
      return {total:balance.total,used:balance.used,pending:balance.pending,remaining:balance.remaining};
    };
    await pair({method:'PUT',path:`/leaves/${ids.pendingLeave}/action`,payload:{status:'approved'}});
    assert.deepEqual(await balanceState(v1Models),await balanceState(v2.leaveBalanceModels));
    const actionBalance=await balanceState(v1Models);
    assert.deepEqual(actionBalance,{total:12,used:2,pending:1,remaining:9});

    await pair({method:'POST',path:`/leaves/${ids.approvedLeave}/revert-request`,payload:{fromDate:'2026-11-12',toDate:'2026-11-12',reason:'Schedule change'}});
    await pair({method:'PUT',path:`/leaves/${ids.approvedLeave}/revert-request/action`,payload:{status:'approved'}});
    assert.deepEqual(await balanceState(v1Models),await balanceState(v2.leaveBalanceModels));
    assert.deepEqual(await balanceState(v1Models),{total:12,used:1,pending:1,remaining:10});
    const [v1Leave,v2Leave]=await Promise.all([
      v1Models.Leave.findById(ids.approvedLeave).lean(),v2.leaveModels.Leave.findById(ids.approvedLeave).lean(),
    ]);
    assert.equal(v1Leave.status,'cancelled'); assert.equal(v2Leave.status,'cancelled');
    assert.equal(v1Leave.revertRequest.status,'approved'); assert.equal(v2Leave.revertRequest.status,'approved');
  });
  await t.test('leave rejection response and persisted state match',async()=>{
    await pair({method:'PUT',path:`/leaves/${ids.rejectedLeave}/action`,payload:{status:'rejected',rejectionReason:'Coverage is unavailable'}});
    const [v1Leave,v2Leave]=await Promise.all([
      v1Models.Leave.findById(ids.rejectedLeave).lean(),v2.leaveModels.Leave.findById(ids.rejectedLeave).lean(),
    ]);
    assert.equal(v1Leave.status,'rejected');
    assert.equal(v2Leave.status,'rejected');
    assert.deepEqual(stable(v2Leave),stable(v1Leave));
    const [v1Balance,v2Balance]=await Promise.all([
      v1Models.LeaveBalance.findById(ids.leaveBalance).lean(),v2.leaveBalanceModels.LeaveBalance.findById(ids.leaveBalance).lean(),
    ]);
    assert.deepEqual({pending:v2Balance.pending,remaining:v2Balance.remaining},{pending:v1Balance.pending,remaining:v1Balance.remaining});
  });
  await t.test('leave action cannot mutate a pending request from another organization',async()=>{
    const response=await pair({method:'PUT',path:`/leaves/${ids.foreignLeave}/action`,payload:{status:'approved'},compareBody:false});
    assert.match(response.v1.message,/leaveCycleStartMonth/,'V1 exposes its unscoped foreign-leave lookup failure');
    assert.equal(response.v2.message,'Leave not found','V2 conceals foreign-tenant record existence');
    const [v1Leave,v2Leave]=await Promise.all([
      v1Models.Leave.findById(ids.foreignLeave).lean(),v2.leaveModels.Leave.findById(ids.foreignLeave).lean(),
    ]);
    assert.equal(v1Leave.status,'pending');
    assert.equal(v2Leave.status,'pending');
    assert.equal(String(v1Leave.organizationId),String(ids.foreignOrganization));
    assert.equal(String(v2Leave.organizationId),String(ids.foreignOrganization));
  });
  await t.test('all five activity success routes match with deterministic monitor data',async()=>{
    const query=`?date=${monitorDay}`;
    for(const path of ['/laptop-health','/employees','/apps','/app-key-usage','/browser-history'])await pair({method:'GET',path:`/activity${path}${path==='/laptop-health'?'':query}`});
  });
});
