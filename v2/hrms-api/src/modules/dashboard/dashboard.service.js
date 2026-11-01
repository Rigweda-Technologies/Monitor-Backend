import {isValidTimeZone,toDateKeyInTimeZone,startOfDayInTimeZone,endOfDayInTimeZone} from '../agents/agent.timezone.js';

const dayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const addDays=(key,count)=>{const [year,month,day]=key.split('-').map(Number),date=new Date(Date.UTC(year,month-1,day+count));return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;};
const weekday=key=>dayNames[new Date(`${key}T00:00:00Z`).getUTCDay()];
const idOf=value=>String(value?._id||value?.employeeId||value||'');
const activeEmployee=employee=>employee&&employee.status!=='resigned'&&employee.employmentLifecycleStatus!=='terminated';
const validPermission=(codes,list)=>codes.includes('*')||list.some(code=>codes.includes(code));
const safe=async(fn,fallback)=>{try{return await fn();}catch{return fallback;}};
const validTimeZone=async(models,organizationId)=>{
  const settings=await models.OrgSettings.findOne({organizationId}).select('timezone').lean();
  if(isValidTimeZone(settings?.timezone))return settings.timezone;
  const organization=await models.Organization.findById(organizationId).select('timezone').lean();
  return isValidTimeZone(organization?.timezone)?organization.timezone:'Asia/Kolkata';
};
const dateKey=value=>String(value||'').slice(0,10);

export const createDashboardService=({models,dependencies,now=()=>new Date()})=>({
  async getSummary(request){
    const organizationId=request.user.organizationId,query=request.query||{},permissionCodes=await dependencies.getPermissionCodes(request);
    const current=now(),month=query.month||toDateKeyInTimeZone(current,'UTC').slice(0,7),year=Number(query.year||current.getFullYear());
    const timeZone=await validTimeZone(models,organizationId),todayKey=toDateKeyInTimeZone(current,timeZone),start7Key=addDays(todayKey,-6),start30Key=addDays(todayKey,-29);
    const monthYear=Number(month.slice(0,4)),monthNumber=Number(month.slice(5,7));
    const monthStartDateUtc=new Date(Date.UTC(monthYear,Math.max(0,monthNumber-1),1)),monthEndDateUtc=new Date(Date.UTC(monthYear,Math.max(0,monthNumber),0,23,59,59,999));
    const canEmployees=validPermission(permissionCodes,['EMP_VIEW']),canAttendance=validPermission(permissionCodes,['TIMESHEET_VIEW_ALL']),canLeaves=validPermission(permissionCodes,['LEAVE_VIEW_ALL']),canHolidays=validPermission(permissionCodes,['HOLIDAY_VIEW']),canWeekOffs=validPermission(permissionCodes,['WEEK_OFF_VIEW']),canSettings=validPermission(permissionCodes,['ORG_SETTINGS_VIEW']),canNotifications=validPermission(permissionCodes,['NOTIFICATION_VIEW_SELF']);
    const [employeeData,holidays,orgSettings,notificationsData]=await Promise.all([
      canEmployees?safe(()=>dependencies.listEmployees({...request,query:{...query,compact:'true'}}),{items:[],pagination:null}):{items:[],pagination:null},
      canHolidays?safe(()=>dependencies.listHolidays({organizationId,year,status:'active'}),[]):[],
      canSettings?safe(()=>dependencies.getOrgSettings(request),null):null,
      canNotifications?safe(()=>dependencies.listNotifications({...request,query:{...query,limit:6}}),{items:[]}):{items:[]},
    ]);
    const employees=(employeeData?.items||[]).filter(activeEmployee),employeeIds=employees.map(employee=>employee._id).filter(Boolean),activeIds=new Set(employeeIds.map(String));
    const weekOffMap=(canWeekOffs||canAttendance)?await dependencies.resolveWeekOffMap({organizationId,employees}):{defaultDays:[],employeeMap:new Map()};
    const settings=orgSettings||await safe(()=>dependencies.getAttendanceSettings(organizationId),null);
    if(canAttendance&&employeeIds.length&&settings?.attendanceHoursSource==='monitor_agent'&&dependencies.materializeMonitorAttendance){
      await safe(()=>dependencies.materializeMonitorAttendance({organizationId,start:startOfDayInTimeZone(start30Key,timeZone),end:endOfDayInTimeZone(todayKey,timeZone),timeZone,employees,minWorkHoursPerDay:Number(settings.minWorkHoursPerDay??8)}),null);
    }
    const [attendance,leavesRaw,weeklyRaw]=await Promise.all([
      canAttendance&&employeeIds.length?safe(()=>dependencies.listAttendance({organizationId,employeeIds,startKey:start30Key,endKey:todayKey,timeZone}),[]):[],
      canLeaves&&employeeIds.length?safe(()=>dependencies.listLeaves({organizationId,employeeIds,status:'approved',fromDate:monthStartDateUtc,toDate:monthEndDateUtc}),[]):[],
      canAttendance&&employeeIds.length?safe(()=>dependencies.listTimesheets({organizationId,employeeIds,fromDate:monthStartDateUtc,toDate:monthEndDateUtc,limit:50}),[]):[],
    ]);
    const activeAttendance=(attendance||[]).filter(row=>activeIds.has(idOf(row.employeeId)));
    const holidayMap=new Map((holidays||[]).map(item=>[toDateKeyInTimeZone(item.date,timeZone),item.name]));
    const leaves=(leavesRaw||[]).filter(leave=>activeIds.has(idOf(leave.employeeId)));
    const leaveDates=new Set();
    for(const leave of leaves){let key=toDateKeyInTimeZone(leave.fromDate,timeZone),end=toDateKeyInTimeZone(leave.toDate,timeZone);while(key<=end){leaveDates.add(`${idOf(leave.employeeId)}-${key}`);key=addDays(key,1);}}
    const attendanceByEmployeeDay=new Map();
    for(const row of activeAttendance){const anchor=row.checkInAt||row.checkOutAt||row.date||row.createdAt;if(!anchor)continue;const key=toDateKeyInTimeZone(anchor,timeZone),employeeId=idOf(row.employeeId),mapKey=`${employeeId}-${key}`;const existing=attendanceByEmployeeDay.get(mapKey);if(!existing||new Date(row.checkInAt||row.checkOutAt||row.date)>new Date(existing.checkInAt||existing.checkOutAt||existing.date))attendanceByEmployeeDay.set(mapKey,row);}
    const todayAttendanceByEmployee=new Map();
    for(const row of activeAttendance){
      const employeeId=idOf(row.employeeId),anchor=row.checkInAt||row.checkOutAt||row.date||row.createdAt;
      if(!employeeId||!anchor)continue;
      const anchorKey=toDateKeyInTimeZone(anchor,timeZone),scheduledEndKey=row.scheduledEndAt?toDateKeyInTimeZone(row.scheduledEndAt,timeZone):anchorKey;
      const overnight=Boolean(row.scheduledEndAt&&scheduledEndKey!==anchorKey),relevant=anchorKey===todayKey||(overnight&&scheduledEndKey===todayKey);
      if(!relevant)continue;
      const score=anchorKey===todayKey?3:overnight&&scheduledEndKey===todayKey?2:1,existing=todayAttendanceByEmployee.get(employeeId);
      if(!existing||score>existing.score)todayAttendanceByEmployee.set(employeeId,{score,row});
    }
    const todayStatusList=employees.map(employee=>{
      const employeeId=String(employee._id),attendanceRow=todayAttendanceByEmployee.get(employeeId)?.row||null,holidayName=holidayMap.get(todayKey)||null;
      const days=weekOffMap.employeeMap?.get(employeeId)||weekOffMap.defaultDays||[],isWeekOff=days.includes(weekday(todayKey)),isOnLeave=leaves.some(leave=>idOf(leave.employeeId)===employeeId&&leave.status==='approved'&&todayKey>=toDateKeyInTimeZone(leave.fromDate,timeZone)&&todayKey<=toDateKeyInTimeZone(leave.toDate,timeZone));
      const hasAttendance=Boolean(attendanceRow?.checkInAt||attendanceRow?.checkOutAt),scheduledEnd=attendanceRow?.scheduledEndAt?new Date(attendanceRow.scheduledEndAt):null,pendingCheckout=Boolean(attendanceRow?.checkInAt&&(attendanceRow.status==='checked_in'||!attendanceRow.checkOutAt)&&scheduledEnd&&!Number.isNaN(scheduledEnd.getTime())&&current>=scheduledEnd);
      const countedPresent=!isOnLeave&&hasAttendance,countedOnLeave=isOnLeave,countedAbsent=!isOnLeave&&!hasAttendance;
      return {employeeId,holidayName,isWeekOff,isOnLeave,checkInAt:attendanceRow?.checkInAt||null,checkOutAt:attendanceRow?.checkOutAt||null,lateByMinutes:Number(attendanceRow?.lateByMinutes||0),shiftStartTime:attendanceRow?.shiftStartTime||employee.shiftId?.startTime||null,overriddenBy:attendanceRow?.overriddenBy||null,overriddenAt:attendanceRow?.overriddenAt||null,present:hasAttendance,countedPresent,countedOnLeave,countedAbsent,pendingCheckout,absent:!holidayName&&!isWeekOff&&!isOnLeave&&!hasAttendance};
    });
    const kpis={totalEmployees:employees.length,presentToday:todayStatusList.filter(item=>item.countedPresent).length,absentToday:todayStatusList.filter(item=>item.countedAbsent).length,checkedInOnly:todayStatusList.filter(item=>item.pendingCheckout).length,lateArrivals:todayStatusList.filter(item=>item.countedPresent&&!item.holidayName&&!item.isWeekOff&&item.lateByMinutes>0).length,onLeaveToday:todayStatusList.filter(item=>item.countedOnLeave).length};
    const monthDaySummary={present:kpis.presentToday,pendingCheckout:kpis.checkedInOnly,absent:kpis.absentToday,onLeave:kpis.onLeaveToday,weekOff:todayStatusList.filter(item=>item.isWeekOff).length,holiday:todayStatusList.filter(item=>item.holidayName).length,overridden:todayStatusList.filter(item=>item.overriddenBy||item.overriddenAt).length};
    const grouped={};for(const employee of employees){const name=employee.departmentId?.name||'Unassigned';grouped[name]||={name,employees:0,present:0,onLeave:0,absent:0};grouped[name].employees++;const status=todayStatusList.find(item=>item.employeeId===String(employee._id));if(status?.countedOnLeave)grouped[name].onLeave++;else if(status?.countedPresent)grouped[name].present++;else grouped[name].absent++;}
    const departmentAnalytics=Object.values(grouped).sort((a,b)=>b.employees-a.employees).slice(0,6);
    const trend=(days)=>Array.from({length:days},(_,index)=>{const key=addDays(todayKey,-(days-1-index));let present=0,absent=0,excluded=0;for(const employee of employees){const id=String(employee._id),holiday=holidayMap.has(key),off=(weekOffMap.employeeMap?.get(id)||weekOffMap.defaultDays||[]).includes(weekday(key)),leave=leaveDates.has(`${id}-${key}`),row=attendanceByEmployeeDay.get(`${id}-${key}`);if(holiday||off||leave){excluded++;continue;}if(row?.checkInAt||row?.checkOutAt)present++;else absent++;}return {key,present,absent,excluded};});
    const compactEmployeeList=employees.map(employee=>({_id:employee._id,firstName:employee.firstName||'',lastName:employee.lastName||'',employeeCode:employee.employeeCode||'',dateOfJoining:employee.dateOfJoining||null,status:employee.status||null,departmentId:employee.departmentId?{_id:employee.departmentId._id,name:employee.departmentId.name||''}:null,designationId:employee.designationId?{_id:employee.designationId._id,name:employee.designationId.name||''}:null}));
    const compactLeaveList=leaves.map(leave=>({_id:leave._id,status:leave.status||null,fromDate:leave.fromDate||null,toDate:leave.toDate||null,createdAt:leave.createdAt||null,employeeId:leave.employeeId||null,leaveTypeId:leave.leaveTypeId?{_id:leave.leaveTypeId._id,name:leave.leaveTypeId.name||''}:null}));
    const compactWeeklyList=(weeklyRaw||[]).filter(item=>activeIds.has(idOf(item.employeeId))).map(item=>({_id:item._id,status:item.status||null,weekStart:item.weekStart||null,createdAt:item.createdAt||null,submittedAt:item.submittedAt||null,employeeId:item.employeeId||null}));
    const compactNotifications=(notificationsData?.items||[]).map(item=>({_id:item._id,title:item.title||'',message:item.message||'',createdAt:item.createdAt||null}));
    const attendanceToday=[...todayAttendanceByEmployee.values()].map(entry=>entry.row);
    return {employeeList:compactEmployeeList,attendanceToday:attendanceToday.map(row=>({employeeId:row.employeeId,checkInAt:row.checkInAt||null,checkOutAt:row.checkOutAt||null})),attendanceLast7:activeAttendance.filter(row=>{const key=toDateKeyInTimeZone(row.checkInAt||row.checkOutAt||row.date,timeZone);return key>=start7Key&&key<=todayKey;}).map(row=>({employeeId:row.employeeId,checkInAt:row.checkInAt||null,checkOutAt:row.checkOutAt||null})),attendanceMatrix:[],leaveList:compactLeaveList,weeklyList:compactWeeklyList,holidays:(holidays||[]).map(item=>({_id:item._id,date:item.date||null,name:item.name||''})),weekOffDays:weekOffMap.defaultDays||[],todayStatusList,dashboardStats:{kpis,monthDaySummary,departmentAnalytics,attendanceTrend:trend(7),attendanceTrendMonthly:trend(30)},orgSettings:orgSettings?{timezone:orgSettings.timezone||null,sandwichRuleEnabled:Boolean(orgSettings.sandwichRuleEnabled),attendanceLockEnabled:Boolean(orgSettings.attendanceLockEnabled),leaveTypeCreditMode:orgSettings.leaveTypeCreditMode||null}:null,notifications:compactNotifications};
  },
});
