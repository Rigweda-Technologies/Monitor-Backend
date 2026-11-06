import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { registerDashboardRoutes } from '../src/modules/dashboard/dashboard.routes.js';
import { registerActivityRoutes } from '../src/modules/activity/activity.routes.js';
import { createDashboardService } from '../src/modules/dashboard/dashboard.service.js';
import { createActivityService } from '../src/modules/activity/activity.service.js';
import { createMonitorActivityRepository } from '../src/modules/activity/activity.repository.js';

const orgId='507f1f77bcf86cd799439011';
const auth=async request=>{request.user={userId:'user-1',organizationId:orgId};};
const authorize=async permission=>permission==='DENY'?{code:403,message:'Permission denied'}:null;
const setup=async register=>{const app=Fastify({logger:false,routerOptions:{ignoreTrailingSlash:true}});await register(app);return app;};

test('dashboard and activity routes authorize requests and retain success envelopes',async t=>{
  const calls=[];
  const dashboard=await setup(app=>registerDashboardRoutes(app,{service:{getSummary:async request=>{calls.push(['dashboard',request.query]);return {dashboard:true};}},authenticate:auth,authorize}));
  const routeSchemas=[];
  const activity=await setup(app=>{app.addHook('onRoute',route=>{if(route.method==='GET')routeSchemas.push(route.schema);});return registerActivityRoutes(app,{service:Object.fromEntries(['listLaptopHealth','listEmployees','listAppUsage','listAppKeyUsage','listBrowserHistory'].map(operation=>[operation,async input=>{calls.push([operation,input]);return {operation};}])),authenticate:auth,authorize});});
  t.after(()=>Promise.all([dashboard.close(),activity.close()]));
  const summary=await dashboard.inject({method:'GET',url:'/api/v2/dashboard/summary?month=2026-11&year=2026'});
  assert.equal(summary.statusCode,200);
  assert.deepEqual(summary.json(),{success:true,code:200,message:'Success',data:{dashboard:true},error:null});
  for(const path of ['/laptop-health','/employees?date=2026-11-01','/apps?limit=4&offset=2','/app-key-usage?employeeId=E1','/browser-history?browser=Chrome']){
    const result=await activity.inject({method:'GET',url:`/api/v2/activity${path}`});
    assert.equal(result.statusCode,200,path);
    assert.equal(result.json().success,true,path);
  }
  const denied=await setup(app=>registerActivityRoutes(app,{service:{},authenticate:auth,authorize:async()=>({code:403,message:'Permission denied'})}));
  t.after(()=>denied.close());
  assert.equal((await denied.inject({method:'GET',url:'/api/v2/activity/employees'})).statusCode,403);
  assert.equal(calls.length,6);
  assert.deepEqual(calls.find(([name])=>name==='listAppUsage')[1],{organizationId:orgId,date:'',limit:4,offset:2,appName:'',processName:'',employeeId:''});
  assert.equal(calls.find(([name])=>name==='listBrowserHistory')[1].browser,'Chrome');
  assert.equal(routeSchemas.length,5);
  assert.ok(routeSchemas.every(schema=>schema?.summary&&schema?.tags?.includes('Activity')));
});

test('dashboard summary preserves timezone day boundaries and permission-gated data sections',async()=>{
  const calls=[];
  const service=createDashboardService({
    models:{Organization:{findById:()=>({select:()=>({lean:async()=>({timezone:'America/Los_Angeles'})})})},OrgSettings:{findOne:()=>({select:()=>({lean:async()=>({timezone:'Asia/Kolkata'})})})}},
    now:()=>new Date('2026-11-01T08:00:00.000Z'),
    dependencies:{
      getPermissionCodes:async()=>['EMP_VIEW','TIMESHEET_VIEW_ALL','LEAVE_VIEW_ALL','HOLIDAY_VIEW','WEEK_OFF_VIEW','ORG_SETTINGS_VIEW','NOTIFICATION_VIEW_SELF'],
      listEmployees:async()=>({items:[{_id:'employee-1',firstName:'A',lastName:'B',status:'active',departmentId:{name:'Engineering'}}]}),
      listHolidays:async()=>[],getOrgSettings:async()=>({timezone:'Asia/Kolkata',attendanceHoursSource:'monitor_agent'}),materializeMonitorAttendance:async input=>calls.push(['materialize',input]),
      listNotifications:async()=>({items:[]}),resolveWeekOffMap:async()=>({defaultDays:['Sunday'],employeeMap:new Map()}),
      listAttendance:async input=>{calls.push(['attendance',input]);return [{employeeId:'employee-1',checkInAt:'2026-11-01T03:00:00Z',checkOutAt:null,status:'checked_in'}];},
      listLeaves:async()=>[],listTimesheets:async()=>[],
    },
  });
  const result=await service.getSummary({user:{userId:'user-1',organizationId:orgId},query:{}});
  assert.equal(result.orgSettings.timezone,'Asia/Kolkata');
  assert.equal(result.dashboardStats.kpis.totalEmployees,1);
  assert.equal(result.dashboardStats.kpis.presentToday,1);
  assert.ok(calls.some(([kind,input])=>kind==='materialize'&&input.start instanceof Date&&input.end instanceof Date&&input.timeZone==='Asia/Kolkata'));
});

test('dashboard assigns a still-open overnight shift to its scheduled local end day',async()=>{
  const service=createDashboardService({
    models:{OrgSettings:{findOne:()=>({select:()=>({lean:async()=>({timezone:'Asia/Kolkata'})})})},Organization:{findById:()=>({select:()=>({lean:async()=>null})})}},
    now:()=>new Date('2026-11-01T08:00:00Z'),
    dependencies:{getPermissionCodes:async()=>['EMP_VIEW','TIMESHEET_VIEW_ALL'],listEmployees:async()=>({items:[{_id:'e1',status:'active'}]}),listHolidays:async()=>[],getOrgSettings:async()=>({timezone:'Asia/Kolkata'}),listNotifications:async()=>({items:[]}),resolveWeekOffMap:async()=>({defaultDays:[],employeeMap:new Map()}),listAttendance:async()=>[{employeeId:'e1',checkInAt:'2026-10-31T18:00:00Z',scheduledEndAt:'2026-11-01T02:00:00Z',status:'checked_in'}],listLeaves:async()=>[],listTimesheets:async()=>[]},
  });
  const result=await service.getSummary({user:{organizationId:orgId},query:{}});
  assert.equal(result.todayStatusList[0].present,true);
  assert.equal(result.todayStatusList[0].pendingCheckout,true);
  assert.equal(result.attendanceToday.length,1);
});

test('activity service resolves timezone and combines overlapping activity/session intervals',async()=>{
  const repository={
    listEmployeeActivityRows:async()=>({activityRows:[{employeeId:'employee-1',employeeName:'A B',status:'active',activityDate:null,observedAt:'2026-11-01T12:00:00Z',activeSeconds:60,idleSeconds:20}],sessionRows:[{employeeId:'employee-1',employeeName:'A B',startedAt:'2026-11-01T11:59:30Z',endedAt:'2026-11-01T12:00:10Z',activeSeconds:40}]}),
  };
  const service=createActivityService({models:{OrgSettings:{findOne:()=>({select:()=>({lean:async()=>({timezone:'Asia/Kolkata'})})})},Organization:{findById:()=>({select:()=>({lean:async()=>null})})},Employee:{find:()=>({select:()=>({lean:async()=>[]})})}},repository,now:()=>new Date('2026-11-01T12:30:00Z')});
  const result=await service.listEmployees({organizationId:orgId,date:'2026-11-01'});
  assert.equal(result.timezone,'Asia/Kolkata');
  assert.equal(result.employees[0].employeeId,'employee-1');
  assert.equal(result.employees[0].productiveSeconds,70);
  assert.equal(result.employees[0].totalSeconds,70);
});

test('Prisma monitor repository parameterizes organization/day filters and clamps pagination',async()=>{
  const calls=[];
  const prisma={$queryRawUnsafe:async(...args)=>{calls.push(args);return [];}};
  const repository=createMonitorActivityRepository({prisma});
  await repository.listBrowserHistoryRows({organizationId:orgId,dayStart:new Date('2026-11-01T00:00:00Z'),dayEnd:new Date('2026-11-01T23:59:59Z'),limit:20,offset:0,browser:'Chrome'});
  assert.equal(calls.length,2);
  assert.ok(calls.every(args=>args[1]===orgId));
  assert.ok(calls[0][0].includes('COUNT(*)'));
  assert.ok(calls[1][0].includes('LIMIT'));
});
