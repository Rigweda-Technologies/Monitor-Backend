import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAttendanceAutoCheckoutHandler } from '../src/jobs/business-handlers.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const legacyRequire=createRequire(path.join(root,'hrms/back-end/package.json'));
const legacyJob=path.join(root,'hrms/back-end/src/jobs/attendanceAutoCheckout.job.js');
const realDate=Date;
const fixedNow=new realDate(2026,5,15,12,0,0,0);

const fixture=()=>{
  const attendance={organizationId:'org-1',employeeId:'employee-1',date:new realDate(2026,5,15),checkInAt:new realDate(2026,5,15,9),checkOutAt:null,totalMinutes:0,status:'checked_in',saved:false,async save(){this.saved=true;}};
  const calls=[];
  return {attendance,calls,models:{Attendance:{async find(filter){calls.push(['find',filter]);return [attendance];}}},timesheetService:{async upsertTimesheetHours(value){calls.push(['timesheet',value]);}}};
};

test('V1 attendance auto-checkout cron and V2 handler match schedule, attendance output and timesheet hours',async()=>{
  const v1=fixture();let schedule;let callback;
  const originalLoad=Module._load;
  const FrozenDate=class extends realDate{constructor(...args){super(...(args.length?args:[fixedNow.getTime()]));}static now(){return fixedNow.getTime();}};
  delete Module._cache[legacyJob];
  try{
    globalThis.Date=FrozenDate;
    Module._load=function(request,parent,isMain){
      if(parent?.filename===legacyJob&&request==='node-cron')return{schedule:(pattern,run)=>{schedule=pattern;callback=run;}};
      if(parent?.filename===legacyJob&&request==='../modules/timesheets/timesheetAttendance.model')return v1.models.Attendance;
      if(parent?.filename===legacyJob&&request==='../modules/timesheets/timesheet.service')return v1.timesheetService;
      return originalLoad.call(this,request,parent,isMain);
    };
    legacyRequire(legacyJob);
  }finally{
    Module._load=originalLoad;
    globalThis.Date=realDate;
  }
  assert.equal(schedule,'59 23 * * *');
  assert.equal(typeof callback,'function');
  const OriginalDate=globalThis.Date;
  const V1FrozenDate=class extends OriginalDate{constructor(...args){super(...(args.length?args:[fixedNow.getTime()]));}static now(){return fixedNow.getTime();}};
  try{globalThis.Date=V1FrozenDate;await callback();}finally{globalThis.Date=OriginalDate;}

  const v2=fixture();
  const v2Processed=await createAttendanceAutoCheckoutHandler({models:v2.models,timesheetService:v2.timesheetService,now:()=>fixedNow})();
  assert.equal(v2Processed,1);
  const publicAttendance=({organizationId,employeeId,date,checkInAt,checkOutAt,totalMinutes,status,saved})=>({organizationId,employeeId,date:date.toISOString(),checkInAt:checkInAt.toISOString(),checkOutAt:checkOutAt.toISOString(),totalMinutes,status,saved});
  assert.deepEqual(publicAttendance(v2.attendance),publicAttendance(v1.attendance));
  const normalizeCalls=calls=>calls.map(([kind,value])=>kind==='find'?{kind,filter:{...value,date:value.date.toISOString()}}:{kind,value:{...value,dateValue:value.dateValue.toISOString()}});
  assert.deepEqual(normalizeCalls(v2.calls),normalizeCalls(v1.calls));
  assert.equal(v2.calls[1][1].hoursWorked,15);
});
