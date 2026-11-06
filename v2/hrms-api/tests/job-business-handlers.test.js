import test from 'node:test';
import assert from 'node:assert/strict';
import { JOBS } from '../src/jobs/runtime.js';
import { createAttendanceAutoCheckoutHandler, createLeaveCreditHandler, createLeaveCarryForwardHandler, createProbationCompletionHandler, createHrmsJobHandlers } from '../src/jobs/business-handlers.js';

const oid='507f1f77bcf86cd799439011';

test('leave credits select active leave types/employees and issue a period-guarded bulk upsert',async()=>{
  const calls=[];
  const models={
    Organization:{find:()=>({select:async()=>[{_id:oid}]}),findById:async id=>({_id:id,leaveCycleStartMonth:4})},
    OrgSettings:{findOne:async()=>({leaveCreditFrequency:'monthly'})},
    LeaveBalance:{updateMany:async(...args)=>calls.push(['guard',...args]),bulkWrite:async(...args)=>calls.push(['bulk',...args])},
    LeaveType:{find:async filter=>{calls.push(['types',filter]);return [{_id:'lt',daysPerYear:12,status:'active'}];}},
    Employee:{find:async filter=>{calls.push(['employees',filter]);return [{_id:'e1'},{_id:'e2'}];}},
  };
  const handler=createLeaveCreditHandler({models,now:()=>new Date('2026-06-15T12:00:00Z')});
  await handler();
  const bulk=calls.find(([name])=>name==='bulk')[1];
  assert.deepEqual(calls.find(([name])=>name==='types')[1],{organizationId:oid,status:'active'});
  assert.deepEqual(calls.find(([name])=>name==='employees')[1],{organizationId:oid,status:'active'});
  assert.equal(bulk.length,2);
  assert.equal(bulk[0].updateOne.filter.cycleStartYear,2026);
  assert.equal(bulk[0].updateOne.filter.$or[1].lastCreditedAt.$lt.getTime(),new Date(2026,5,1).getTime());
  assert.equal(bulk[0].updateOne.update.$inc.total,1);
  assert.equal(bulk[0].updateOne.update.$set.lastCreditedAt.getTime(),new Date(2026,5,1).getTime());
});

test('leave credit guard makes a repeated period no-op after lastCreditedAt is set',async()=>{
  let lastCreditedAt=null,bulkCalls=0,appliedCredits=0;
  const models={
    Organization:{find:()=>({select:async()=>[{_id:oid,leaveCycleStartMonth:1}]}),findById:async()=>({_id:oid,leaveCycleStartMonth:1})},
    OrgSettings:{findOne:async()=>({leaveCreditFrequency:'monthly'})},
    LeaveBalance:{updateMany:async()=>{},bulkWrite:async ops=>{bulkCalls+=1;const operation=ops[0].updateOne;if(!lastCreditedAt||lastCreditedAt<operation.filter.$or[1].lastCreditedAt.$lt){appliedCredits+=operation.update.$inc.total;lastCreditedAt=operation.update.$set.lastCreditedAt;}}},
    LeaveType:{find:async()=>[{_id:'lt',daysPerYear:12}]},Employee:{find:async()=>[{_id:'e1'}]},
  };
  const handler=createLeaveCreditHandler({models,now:()=>new Date('2026-06-15T12:00:00Z')});
  await handler();
  await handler();
  assert.equal(bulkCalls,2);
  assert.equal(appliedCredits,1);
  assert.equal(lastCreditedAt.getTime(),new Date(2026,5,1).getTime());
});

test('carry-forward only selects enabled active types and applies the legacy maximum cap',async()=>{
  const calls=[];
  const balance={remaining:5,total:10};
  const models={
    Organization:{find:async()=>[{_id:oid}],findById:async()=>({_id:oid,leaveCycleStartMonth:4})},
    LeaveType:{find:async filter=>{calls.push(['types',filter]);return [{_id:'lt',maxCarryForward:3}];}},
    LeaveBalance:{find:async filter=>{calls.push(['balances',filter]);return [balance];},findOne:async()=>balance,updateOne:async(...args)=>{calls.push(['updateOne',...args]);if(!(balance.carryForwardedFromCycleYears||[]).includes(2025)){balance.total+=args[1].$inc.total;balance.remaining+=args[1].$inc.remaining;balance.carryForwardedFromCycleYears=[...(balance.carryForwardedFromCycleYears||[]),args[1].$addToSet.carryForwardedFromCycleYears];return {modifiedCount:1};}return {modifiedCount:0};},create:async doc=>calls.push(['create',doc])},
  };
  const handler=createLeaveCarryForwardHandler({models,now:()=>new Date('2026-06-15T12:00:00Z')});
  await handler();
  assert.deepEqual(calls.find(([name])=>name==='types')[1],{organizationId:oid,isCarryForward:true,status:'active'});
  assert.equal(calls.find(([name])=>name==='balances')[1].cycleStartYear,2025);
  const update=calls.find(([name])=>name==='updateOne');
  assert.deepEqual(update[1].carryForwardedFromCycleYears,{$ne:2025});
  assert.equal(update[2].$addToSet.carryForwardedFromCycleYears,2025);
  assert.equal(balance.total,13);
  assert.equal(balance.remaining,8);
});

test('carry-forward retry does not apply the same source cycle twice',async()=>{
  let total=0,remaining=0;
  const target={carryForwardedFromCycleYears:[],get total(){return total;},set total(value){total=value;},get remaining(){return remaining;},set remaining(value){remaining=value;}};
  const models={Organization:{find:async()=>[{_id:oid}],findById:async()=>({_id:oid,leaveCycleStartMonth:1})},LeaveType:{find:async()=>[{_id:'lt',maxCarryForward:null}]},LeaveBalance:{find:async()=>[{remaining:2,employeeId:'e1'}],findOne:async()=>target,updateOne:async(filter,update)=>{if(target.carryForwardedFromCycleYears.includes(filter.carryForwardedFromCycleYears.$ne))return {modifiedCount:0};total+=update.$inc.total;remaining+=update.$inc.remaining;target.carryForwardedFromCycleYears.push(update.$addToSet.carryForwardedFromCycleYears);return {modifiedCount:1};},create:async()=>{throw new Error('unexpected create');}}};
  const handler=createLeaveCarryForwardHandler({models,now:()=>new Date('2026-06-15T12:00:00Z')});
  await handler();await handler();
  assert.equal(target.total,2);
  assert.equal(target.remaining,2);
  assert.deepEqual(target.carryForwardedFromCycleYears,[2025]);
});

test('carry-forward recovers from a worker crash after creating the next-cycle balance',async()=>{
  const oldBalance={organizationId:oid,employeeId:'e1',leaveTypeId:'lt',cycleStartYear:2025,total:4,used:1,remaining:3};
  const balances=[oldBalance]; let interrupted=true;
  const models={
    Organization:{find:async()=>[{_id:oid}],findById:async()=>({_id:oid,leaveCycleStartMonth:1})},
    LeaveType:{find:async()=>[{_id:'lt',isCarryForward:true,status:'active',maxCarryForward:null}]},
    LeaveBalance:{
      find:async filter=>balances.filter(row=>row.organizationId===filter.organizationId&&row.leaveTypeId===filter.leaveTypeId&&row.cycleStartYear===filter.cycleStartYear),
      findOne:async filter=>balances.find(row=>row.organizationId===filter.organizationId&&row.employeeId===filter.employeeId&&row.leaveTypeId===filter.leaveTypeId&&row.cycleStartYear===filter.cycleStartYear)||null,
      create:async row=>{const created={...row};balances.push(created);if(interrupted){interrupted=false;throw new Error('worker crashed after insert');}return created;},
      updateOne:async(filter,update)=>{const row=balances.find(item=>item.organizationId===filter.organizationId&&item.employeeId===filter.employeeId&&item.leaveTypeId===filter.leaveTypeId&&item.cycleStartYear===filter.cycleStartYear&&!(item.carryForwardedFromCycleYears||[]).includes(filter.carryForwardedFromCycleYears.$ne));if(!row)return{modifiedCount:0};row.total+=update.$inc.total;row.remaining+=update.$inc.remaining;row.carryForwardedFromCycleYears=[...(row.carryForwardedFromCycleYears||[]),update.$addToSet.carryForwardedFromCycleYears];return{modifiedCount:1};},
    },
  };
  const handler=createLeaveCarryForwardHandler({models,now:()=>new Date('2026-06-15T12:00:00Z')});
  await assert.rejects(handler(),/worker crashed after insert/);
  assert.equal(balances.length,2,'the initial carry-forward insert survived the simulated crash');
  assert.equal(await handler(),undefined,'retry repairs the existing next-cycle balance');
  const next=balances.find(row=>row.cycleStartYear===2026);
  assert.equal(next.total,3);
  assert.equal(next.remaining,3);
  assert.deepEqual(next.carryForwardedFromCycleYears,[2025]);
  await handler();
  assert.equal(next.total,3,'subsequent retry does not duplicate the carry-forward amount');
});

test('probation notification deduplicates recipients, excludes employee self, and marks notified for idempotent retries',async()=>{
  const sent=[];
  const employee={_id:'employee1',organizationId:oid,userId:'staff',managerId:'manager',firstName:'A',lastName:'B',employeeCode:'E1',probationEndDate:new Date('2026-06-01T00:00:00Z'),probationCompletionNotifiedAt:null,save:async()=>{employee.probationCompletionNotifiedAt=new Date('2026-06-15T00:00:00Z');}};
  const models={
    Employee:{find:filter=>({select:async()=>filter.probationCompletionNotifiedAt===null&&!employee.probationCompletionNotifiedAt?[employee]:filter.userId?.$in?filter.userId.$in.map(userId=>({_id:`emp-${userId}`,userId})):[]}),findById:()=>({select:async()=>({userId:'manager'})})},
    Role:{find:()=>({select:async()=>[{_id:'role'}]})},OrgUser:{find:()=>({select:async()=>[{userId:'manager'},{userId:'admin'},{userId:'staff'}]})},Notification:{findOne:()=>({select:async()=>null})},
  };
  const handler=createProbationCompletionHandler({models,notificationService:{createNotificationSafe:async payload=>sent.push(payload)},now:()=>new Date('2026-06-15T12:00:00Z')});
  assert.equal(await handler(),1);
  assert.deepEqual(sent.map(item=>item.recipientUserId),['manager','admin']);
  assert.equal(sent[0].type,'probation_completed');
  assert.ok(employee.probationCompletionNotifiedAt);
  assert.equal(await handler(),0);
  assert.equal(sent.length,2);
});

test('probation notification retry skips recipients whose notification was persisted before a crash',async()=>{
  const existing=new Set(),attempts=[];let crashOnce=true;
  const employee={_id:'employee1',organizationId:oid,userId:'staff',managerId:'manager',firstName:'A',lastName:'B',employeeCode:'E1',probationEndDate:new Date('2026-06-01T00:00:00Z'),probationCompletionNotifiedAt:null,save:async()=>{employee.probationCompletionNotifiedAt=new Date('2026-06-15T00:00:00Z');}};
  const models={
    Employee:{find:filter=>({select:async()=>filter.probationCompletionNotifiedAt===null&&!employee.probationCompletionNotifiedAt?[employee]:filter.userId?.$in?filter.userId.$in.map(userId=>({_id:`emp-${userId}`,userId})):[]}),findById:()=>({select:async()=>({userId:'manager'})})},
    Role:{find:()=>({select:async()=>[{_id:'role'}]})},OrgUser:{find:()=>({select:async()=>[{userId:'manager'},{userId:'admin'}]})},
    Notification:{findOne:filter=>({select:async()=>existing.has(String(filter.recipientUserId))?{_id:`n-${filter.recipientUserId}`}:null})},
  };
  const notificationService={createNotificationSafe:async payload=>{attempts.push(payload.recipientUserId);existing.add(payload.recipientUserId);if(crashOnce&&payload.recipientUserId==='manager'){crashOnce=false;throw new Error('worker interrupted after insert');}}};
  const handler=createProbationCompletionHandler({models,notificationService,now:()=>new Date('2026-06-15T12:00:00Z')});
  await assert.rejects(handler(),/worker interrupted/);
  assert.equal(employee.probationCompletionNotifiedAt,null);
  assert.equal(await handler(),1);
  assert.deepEqual(attempts,['manager','admin']);
  assert.ok(employee.probationCompletionNotifiedAt);
  assert.equal(await handler(),0);
  assert.deepEqual(attempts,['manager','admin']);
});

test('attendance auto-checkout closes open local-day records and upserts matching timesheet hours',async()=>{
  const now=new Date(2026,5,15,12,0,0,0),today=new Date(now);today.setHours(0,0,0,0);
  const dayEnd=new Date(today);dayEnd.setHours(23,59,59,999);
  const attendance={organizationId:oid,employeeId:'employee-1',date:today,checkInAt:new Date(2026,5,15,9,0,0,0),checkOutAt:null,totalMinutes:0,status:'checked_in',save:async()=>{attendance.saved=true;}};
  const calls=[];
  const handler=createAttendanceAutoCheckoutHandler({models:{Attendance:{find:async filter=>{calls.push(['find',filter]);return [attendance];}}},timesheetService:{upsertTimesheetHours:async value=>calls.push(['timesheet',value])},now:()=>now});
  assert.equal(await handler(),1);
  assert.deepEqual(calls[0],['find',{date:today,checkInAt:{$ne:null},checkOutAt:null}]);
  assert.equal(attendance.checkOutAt.getTime(),dayEnd.getTime());
  assert.equal(attendance.totalMinutes,900);
  assert.equal(attendance.status,'checked_out');
  assert.equal(attendance.saved,true);
  assert.deepEqual(calls[1],['timesheet',{organizationId:oid,employeeId:'employee-1',dateValue:today,hoursWorked:15}]);
});

test('attendance auto-checkout preserves V1 write order when timesheet upsert fails',async()=>{
  const now=new Date(2026,5,15,12,0,0,0),attendance={organizationId:oid,employeeId:'employee-1',checkInAt:new Date(2026,5,15,9,0,0,0),checkOutAt:null,status:'checked_in',save:async()=>{attendance.saved=true;}};
  let attempts=0;
  const handler=createAttendanceAutoCheckoutHandler({models:{Attendance:{find:async()=>attendance.checkOutAt?[]:[attendance]}},timesheetService:{upsertTimesheetHours:async()=>{attempts+=1;if(attempts===1)throw new Error('temporary timesheet failure');}},now:()=>now});
  await assert.rejects(handler(),/temporary timesheet failure/);
  assert.ok(attendance.checkOutAt instanceof Date);
  assert.equal(attendance.saved,true);
  assert.equal(await handler(),0);
  assert.equal(attendance.status,'checked_out');
  assert.equal(attendance.saved,true);
  assert.equal(attempts,1);
});

test('job-handler map keeps all v1 names and delegates document expiry to the injected V2 service',async()=>{
  const calls=[];
  const models={Organization:{find:async()=>[]},Attendance:{find:async()=>[]}};
  const handlers=createHrmsJobHandlers({models,timesheetService:{upsertTimesheetHours:async()=>{}},organizationDocumentService:{notifyExpiringDocuments:async()=>{calls.push('documents');return 4;}},notificationService:{createNotificationSafe:async()=>{}},now:()=>new Date('2026-06-15T12:00:00Z')});
  assert.deepEqual(Object.keys(handlers),[JOBS.LEAVE_CREDIT_DAILY,JOBS.LEAVE_CARRY_FORWARD_DAILY,JOBS.PROBATION_COMPLETION_DAILY,JOBS.ORGANIZATION_DOCUMENT_EXPIRY_DAILY,JOBS.ATTENDANCE_AUTO_CHECKOUT]);
  assert.equal(await handlers[JOBS.ORGANIZATION_DOCUMENT_EXPIRY_DAILY](),4);
  assert.deepEqual(calls,['documents']);
});
