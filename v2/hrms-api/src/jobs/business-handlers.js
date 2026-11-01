import { JOBS } from './runtime.js';

const probationRoles=['teamlead','team-lead','team_lead','lead','manager','admin','org-admin','super_admin','superadmin'];
const roundTwo=value=>Math.round(value*100)/100;
const roundHalf=value=>roundTwo(Math.round(Number(value||0)*2)/2);
const cycleStartDate=(value,startMonth)=>{const date=new Date(value),year=date.getMonth()+1<startMonth?date.getFullYear()-1:date.getFullYear();return new Date(year,startMonth-1,1);};
const periodInfo=(value,frequency,startMonth)=>{
  const date=new Date(value);date.setHours(0,0,0,0);
  if(frequency==='monthly')return {periodStart:new Date(date.getFullYear(),date.getMonth(),1),periodsPerYear:12};
  const start=cycleStartDate(date,startMonth);
  if(frequency==='yearly')return {periodStart:start,periodsPerYear:1};
  const months=(date.getFullYear()-start.getFullYear())*12+(date.getMonth()-start.getMonth());
  const quarter=Math.floor(months/3);
  return {periodStart:new Date(start.getFullYear(),start.getMonth()+quarter*3,1),periodsPerYear:4};
};
const dateStart=value=>{const date=new Date(value);date.setHours(0,0,0,0);return date;};
const valueId=value=>String(value?._id??value??'');

const creditOrganization=async({models,organizationId,date})=>{
  const org=await models.Organization.findById(organizationId);if(!org)return;
  const settings=await models.OrgSettings.findOne({organizationId}),frequency=settings?.leaveCreditFrequency||'monthly';
  const {periodStart,periodsPerYear}=periodInfo(date,frequency,org.leaveCycleStartMonth);
  if(date<periodStart)return;
  await models.LeaveBalance.updateMany({organizationId,lastCreditedAt:{$exists:false},createdAt:{$lt:periodStart}},{$set:{lastCreditedAt:periodStart}});
  const cycleStartYear=periodStart.getMonth()+1<org.leaveCycleStartMonth?periodStart.getFullYear()-1:periodStart.getFullYear();
  const [leaveTypes,employees]=await Promise.all([
    models.LeaveType.find({organizationId,status:'active'}),
    models.Employee.find({organizationId,status:'active'}),
  ]);
  if(!leaveTypes.length||!employees.length)return;
  const operations=[];
  for(const leaveType of leaveTypes){
    const credit=roundHalf(leaveType.daysPerYear/periodsPerYear);
    for(const employee of employees)operations.push({updateOne:{filter:{organizationId,employeeId:employee._id,leaveTypeId:leaveType._id,cycleStartYear,$or:[{lastCreditedAt:{$exists:false}},{lastCreditedAt:{$lt:periodStart}}]},update:{$setOnInsert:{total:0,used:0,pending:0,remaining:0},$inc:{total:credit,remaining:credit},$set:{lastCreditedAt:periodStart}},upsert:true}});
  }
  if(operations.length)await models.LeaveBalance.bulkWrite(operations,{ordered:false});
};

export const createLeaveCreditHandler=({models,now=()=>new Date()})=>async()=>{
  const organizations=await models.Organization.find({}).select('_id');
  for(const organization of organizations)await creditOrganization({models,organizationId:organization._id,date:now()});
};

const carryForwardOrganization=async({models,organizationId,date})=>{
  const organization=await models.Organization.findById(organizationId);if(!organization)return;
  const startMonth=organization.leaveCycleStartMonth;
  const newCycleYear=date.getMonth()+1>=startMonth?date.getFullYear():date.getFullYear()-1,previousCycleYear=newCycleYear-1;
  const leaveTypes=await models.LeaveType.find({organizationId,isCarryForward:true,status:'active'});
  if(!leaveTypes.length)return;
  for(const leaveType of leaveTypes){
    const balances=await models.LeaveBalance.find({organizationId,leaveTypeId:leaveType._id,cycleStartYear:previousCycleYear});
    for(const balance of balances){
      let amount=balance.remaining;
      if(leaveType.maxCarryForward!==null)amount=Math.min(amount,leaveType.maxCarryForward);
      if(amount<=0)continue;
      const nextFilter={organizationId,employeeId:balance.employeeId,leaveTypeId:leaveType._id,cycleStartYear:newCycleYear};
      const next=await models.LeaveBalance.findOne(nextFilter);
      if(next?.carryForwardedFromCycleYears?.includes(previousCycleYear))continue;
      const applyToExisting=()=>models.LeaveBalance.updateOne({...nextFilter,carryForwardedFromCycleYears:{$ne:previousCycleYear}},{$inc:{total:amount,remaining:amount},$addToSet:{carryForwardedFromCycleYears:previousCycleYear}});
      if(next){await applyToExisting();continue;}
      try{
        await models.LeaveBalance.create({...nextFilter,total:amount,used:0,remaining:amount,carryForwardedFromCycleYears:[previousCycleYear]});
      }catch(error){
        if(Number(error?.code)!==11000)throw error;
        // A concurrent worker created the target balance; apply only if it lacks the source-cycle marker.
        await applyToExisting();
      }
    }
  }
};

export const createLeaveCarryForwardHandler=({models,now=()=>new Date()})=>async()=>{
  const organizations=await models.Organization.find({});
  for(const organization of organizations)await carryForwardOrganization({models,organizationId:organization._id,date:now()});
};

const recipientsForEmployee=async(models,employee)=>{
  const recipients=new Set();
  if(employee.managerId){const manager=await models.Employee.findById(employee.managerId).select('userId');if(manager?.userId)recipients.add(String(manager.userId));}
  const roleRows=await models.Role.find({organizationId:employee.organizationId,slug:{$in:probationRoles}}).select('_id');
  const roleIds=roleRows.map(role=>role._id);
  if(roleIds.length){const memberships=await models.OrgUser.find({organizationId:employee.organizationId,roleIds:{$in:roleIds}}).select('userId');for(const row of memberships)if(row.userId)recipients.add(String(row.userId));}
  return [...recipients];
};

export const createProbationCompletionHandler=({models,notificationService,now=()=>new Date()})=>async()=>{
  const today=dateStart(now());
  const employees=await models.Employee.find({isDeleted:false,employmentLifecycleStatus:'probation',probationEndDate:{$lte:today},probationCompletionNotifiedAt:null}).select('organizationId managerId userId firstName lastName employeeCode probationEndDate');
  for(const employee of employees){
    const recipients=await recipientsForEmployee(models,employee);
    if(!recipients.length){employee.probationCompletionNotifiedAt=now();await employee.save();continue;}
    const recipientEmployees=await models.Employee.find({organizationId:employee.organizationId,userId:{$in:recipients},isDeleted:false}).select('userId');
    const employeeByUser=new Map(recipientEmployees.map(row=>[String(row.userId),row._id]));
    const name=`${employee.firstName||''} ${employee.lastName||''}`.trim(),probationDate=employee.probationEndDate?new Date(employee.probationEndDate).toDateString():'today';
    for(const recipientUserId of recipients){
      if(recipientUserId===String(employee.userId))continue;
      const existing=await models.Notification.findOne({organizationId:employee.organizationId,recipientUserId,type:'probation_completed','meta.employeeId':employee._id,'meta.probationEndDate':employee.probationEndDate}).select('_id');
      if(existing)continue;
      await notificationService.createNotificationSafe({organizationId:employee.organizationId,recipientUserId,recipientEmployeeId:employeeByUser.get(recipientUserId)||null,actorEmployeeId:employee._id,type:'probation_completed',title:'Probation completed',message:`${name} (${employee.employeeCode}) completed probation on ${probationDate}.`,meta:{employeeId:employee._id,employeeCode:employee.employeeCode,probationEndDate:employee.probationEndDate}});
    }
    employee.probationCompletionNotifiedAt=now();await employee.save();
  }
  return employees.length;
};

export const createAttendanceAutoCheckoutHandler=({models,timesheetService,now=()=>new Date()})=>async()=>{
  const today=new Date(now());today.setHours(0,0,0,0);
  const dayEnd=new Date(today);dayEnd.setHours(23,59,59,999);
  const attendances=await models.Attendance.find({date:today,checkInAt:{$ne:null},checkOutAt:null});
  let processed=0;
  for(const attendance of attendances){
    const totalMinutes=Math.max(0,Math.round((dayEnd.getTime()-new Date(attendance.checkInAt).getTime())/60000));
    attendance.checkOutAt=dayEnd;
    attendance.totalMinutes=totalMinutes;
    attendance.status='checked_out';
    await attendance.save();
    await timesheetService.upsertTimesheetHours({organizationId:attendance.organizationId,employeeId:attendance.employeeId,dateValue:today,hoursWorked:Number((totalMinutes/60).toFixed(2))});
    processed+=1;
  }
  return processed;
};

export const createHrmsJobHandlers=({models,notificationService,organizationDocumentService,timesheetService,now=()=>new Date()})=>({
  [JOBS.LEAVE_CREDIT_DAILY]:createLeaveCreditHandler({models,now}),
  [JOBS.LEAVE_CARRY_FORWARD_DAILY]:createLeaveCarryForwardHandler({models,now}),
  [JOBS.PROBATION_COMPLETION_DAILY]:createProbationCompletionHandler({models,notificationService,now}),
  [JOBS.ORGANIZATION_DOCUMENT_EXPIRY_DAILY]:async()=>{
    if(typeof organizationDocumentService?.notifyExpiringDocuments!=='function')throw new Error('Organization document expiry handler is not configured');
    return organizationDocumentService.notifyExpiringDocuments();
  },
  [JOBS.ATTENDANCE_AUTO_CHECKOUT]:createAttendanceAutoCheckoutHandler({models,timesheetService,now}),
});

export const jobHandlerNames=Object.freeze(Object.values(JOBS).filter(name=>name!==JOBS.PAYROLL_RUN_COMPUTE));
