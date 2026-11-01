import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLeaveCarryForwardHandler, createLeaveCreditHandler, createProbationCompletionHandler } from '../src/jobs/business-handlers.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const legacyRequire=createRequire(path.join(root,'hrms/back-end/package.json'));
const fixedNow=new Date(2026,5,15,12,0,0,0);
const realDate=Date;

const loadLegacyService=(relativePath,dependencies)=>{
  const filename=path.join(root,relativePath);
  delete Module._cache[filename];
  const originalLoad=Module._load;
  Module._load=function(request,parent,isMain){
    if(parent?.filename===filename&&Object.hasOwn(dependencies,request))return dependencies[request];
    return originalLoad.call(this,request,parent,isMain);
  };
  try{return legacyRequire(filename);}finally{Module._load=originalLoad;}
};

const withFrozenDate=async(callback)=>{
  const FrozenDate=class extends realDate{constructor(...args){super(...(args.length?args:[fixedNow.getTime()]));}static now(){return fixedNow.getTime();}};
  const previous=globalThis.Date;globalThis.Date=FrozenDate;
  try{return await callback();}finally{globalThis.Date=previous;}
};

const clone=value=>structuredClone(value);
const sameId=(a,b)=>String(a?._id??a)===String(b?._id??b);

const creditModels=()=>{
  const organization={_id:'org-1',leaveCycleStartMonth:4};
  const type={_id:'type-1',daysPerYear:10,status:'active'};
  const employee={_id:'employee-1',status:'active'};
  const balances=[{organizationId:'org-1',employeeId:'employee-1',leaveTypeId:'type-1',cycleStartYear:2026,total:1,used:0,pending:0,remaining:1,lastCreditedAt:new Date(2026,2,1),createdAt:new Date(2026,4,1)}];
  const updateMany=async(filter,update)=>{for(const row of balances)if(row.organizationId===filter.organizationId&&!Object.hasOwn(row,'lastCreditedAt')&&row.createdAt<filter.createdAt.$lt)Object.assign(row,update.$set);};
  const bulkWrite=async operations=>{for(const operation of operations){const {filter,update,upsert}=operation.updateOne;let row=balances.find(item=>item.organizationId===filter.organizationId&&sameId(item.employeeId,filter.employeeId)&&sameId(item.leaveTypeId,filter.leaveTypeId)&&item.cycleStartYear===filter.cycleStartYear&&filter.$or.some(condition=>!Object.hasOwn(item,'lastCreditedAt')||item.lastCreditedAt<condition.lastCreditedAt.$lt));if(!row&&upsert){row={...filter.$setOnInsert,...Object.fromEntries(Object.entries(filter).filter(([key])=>!key.startsWith('$')))};balances.push(row);}if(row){row.total+=update.$inc.total;row.remaining+=update.$inc.remaining;Object.assign(row,update.$set);}}};
  const models={
    Organization:{findById:async()=>organization,find:()=>({select:async()=>[organization]})},
    OrgSettings:{findOne:async()=>({leaveCreditFrequency:'quarterly'})},
    LeaveType:{find:async()=>[type]},Employee:{find:async()=>[employee]},
    LeaveBalance:{updateMany,bulkWrite},
  };
  return {models,balances};
};

test('V1 and V2 leave credit services produce the same period balance updates',async()=>{
  const v1=creditModels(),v2=creditModels();
  const service=loadLegacyService('hrms/back-end/src/modules/leaveBalances/leaveCredit.service.js',{
    './leaveBalance.model':{updateMany:v1.models.LeaveBalance.updateMany,bulkWrite:v1.models.LeaveBalance.bulkWrite},
    '../leaveTypes/leaveType.model':v1.models.LeaveType,
    '../employees/employee.model':v1.models.Employee,
    '../organizations/organization.model':v1.models.Organization,
    '../orgSettings/orgSettings.model':v1.models.OrgSettings,
  });
  await service.applyLeaveCreditsForOrg('org-1',fixedNow);
  await createLeaveCreditHandler({models:v2.models,now:()=>fixedNow})();
  const project=rows=>rows.map(({organizationId,employeeId,leaveTypeId,cycleStartYear,total,used,pending,remaining,lastCreditedAt})=>({organizationId,employeeId,leaveTypeId,cycleStartYear,total,used,pending,remaining,lastCreditedAt:lastCreditedAt.toISOString()}));
  assert.deepEqual(project(v2.balances),project(v1.balances));
  assert.equal(v2.balances[0].total,3.5);
});

const carryForwardModels=()=>{
  const organization={_id:'org-1',leaveCycleStartMonth:4};
  const type={_id:'type-1',isCarryForward:true,status:'active',maxCarryForward:4};
  const balances=[
    {organizationId:'org-1',employeeId:'employee-1',leaveTypeId:'type-1',cycleStartYear:2025,total:8,used:1,remaining:7},
    {organizationId:'org-1',employeeId:'employee-1',leaveTypeId:'type-1',cycleStartYear:2026,total:2,used:1,remaining:1,async save(){}},
  ];
  const models={
    Organization:{findById:async()=>organization,find:async()=>[organization]},
    LeaveType:{find:async()=>[type]},
    LeaveBalance:{
      find:async filter=>balances.filter(row=>row.organizationId===filter.organizationId&&sameId(row.leaveTypeId,filter.leaveTypeId)&&row.cycleStartYear===filter.cycleStartYear),
      findOne:async filter=>balances.find(row=>row.organizationId===filter.organizationId&&sameId(row.employeeId,filter.employeeId)&&sameId(row.leaveTypeId,filter.leaveTypeId)&&row.cycleStartYear===filter.cycleStartYear)||null,
      create:async row=>{balances.push(row);return row;},
      updateOne:async(filter,update)=>{const row=balances.find(item=>item.organizationId===filter.organizationId&&sameId(item.employeeId,filter.employeeId)&&sameId(item.leaveTypeId,filter.leaveTypeId)&&item.cycleStartYear===filter.cycleStartYear&&!(item.carryForwardedFromCycleYears||[]).includes(filter.carryForwardedFromCycleYears.$ne));if(!row)return{modifiedCount:0};row.total+=update.$inc.total;row.remaining+=update.$inc.remaining;row.carryForwardedFromCycleYears=[...(row.carryForwardedFromCycleYears||[]),update.$addToSet.carryForwardedFromCycleYears];return{modifiedCount:1};},
    },
  };
  return {models,balances};
};

test('V1 and V2 carry-forward match on first run and V2 retry does not duplicate the credit',async()=>{
  const v1=carryForwardModels(),v2=carryForwardModels();
  const service=loadLegacyService('hrms/back-end/src/modules/leaveCarryForward/leaveCarryForward.service.js',{
    '../leaveBalances/leaveBalance.model':v1.models.LeaveBalance,
    '../leaveTypes/leaveType.model':v1.models.LeaveType,
    '../organizations/organization.model':v1.models.Organization,
  });
  await withFrozenDate(()=>service.runCarryForwardForOrg('org-1'));
  const handler=createLeaveCarryForwardHandler({models:v2.models,now:()=>fixedNow});
  await handler();
  const project=rows=>rows.map(({employeeId,leaveTypeId,cycleStartYear,total,used,remaining})=>({employeeId,leaveTypeId,cycleStartYear,total,used,remaining}));
  assert.deepEqual(project(v2.balances),project(v1.balances));
  await handler();
  assert.deepEqual(project(v2.balances),project(v1.balances));
  assert.deepEqual(v2.balances[1].carryForwardedFromCycleYears,[2025]);
});

const probationModels=sent=>{
  const employee={_id:'employee-1',organizationId:'org-1',managerId:'manager-1',userId:'staff-user',firstName:'Casey',lastName:'Employee',employeeCode:'E-1',probationEndDate:new Date(2026,5,1),employmentLifecycleStatus:'probation',probationCompletionNotifiedAt:null,async save(){this.saved=true;}};
  const query=value=>({select:async()=>value});
  return {
    Employee:{find:filter=>query(filter.userId?.$in?filter.userId.$in.map(userId=>({_id:`emp-${userId}`,userId})):employee.probationCompletionNotifiedAt===null?[employee]:[]),findById:()=>query({userId:'manager-user'})},
    Role:{find:()=>query([{_id:'role-1'}])},OrgUser:{find:()=>query([{userId:'manager-user'},{userId:'admin-user'},{userId:'staff-user'}])},
    Notification:{findOne:()=>query(null)},employee,
    notificationService:{createNotificationSafe:async payload=>sent.push(payload)},
  };
};

test('V1 and V2 probation completion services send matching recipient payloads and mark the employee',async()=>{
  const v1Sent=[],v2Sent=[],v1=probationModels(v1Sent),v2=probationModels(v2Sent);
  const service=loadLegacyService('hrms/back-end/src/modules/employees/employeeLifecycle.service.js',{
    './employee.model':v1.Employee,'../organizations/org-user.model':v1.OrgUser,'../roles/role.model':v1.Role,
    '../notifications/notification.service':{createNotificationSafe:async payload=>v1Sent.push(payload)},
  });
  const v1Count=await withFrozenDate(()=>service.notifyProbationCompleted());
  const v2Count=await createProbationCompletionHandler({models:v2,notificationService:v2.notificationService,now:()=>fixedNow})();
  const normalize=value=>JSON.parse(JSON.stringify(value));
  assert.equal(v2Count,v1Count);
  assert.deepEqual(normalize(v2Sent),normalize(v1Sent));
  assert.equal(v1Sent.length,2);
  assert.equal(v2.employee.saved,true);
  assert.equal(v1.employee.saved,true);
});
