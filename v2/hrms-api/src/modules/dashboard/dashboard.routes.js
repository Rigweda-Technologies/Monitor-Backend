import { failure, httpError, success } from '../../plugins/errors.js';

export const DASHBOARD_PERMISSIONS=['EMP_VIEW','TIMESHEET_VIEW_ALL','ATTENDANCE_VIEW_ALL','LEAVE_VIEW_ALL','HOLIDAY_VIEW','WEEK_OFF_VIEW','ORG_SETTINGS_VIEW','NOTIFICATION_VIEW_SELF'];
const envelope={type:'object',properties:{success:{type:'boolean'},code:{type:'integer'},message:{type:'string'},data:{},error:{}},required:['success','code','message','data','error']};
export const registerDashboardRoutes=async(app,{service,authenticate,authorize})=>{
  app.route({method:'GET',url:'/api/v2/dashboard/summary',schema:{tags:['Dashboard'],summary:'Get organization dashboard summary',security:[{bearerAuth:[]}],querystring:{type:'object',properties:{month:{type:'string',pattern:'^\\d{4}-\\d{2}$'},year:{type:'string',pattern:'^\\d{4}$'}}},response:{200:envelope,401:envelope,403:envelope,500:envelope}},preValidation:[authenticate,async(request,reply)=>{const denied=await authorize(DASHBOARD_PERMISSIONS,request);if(denied)return reply.code(denied.code).send(failure(denied.code,denied.message));}],handler:async(request,reply)=>{
    try{return reply.code(200).send({...success(await service.getSummary(request)),code:200});}catch(error){const status=Number(error.statusCode||error.code);if(Number.isInteger(status)&&status>=400&&status<=599)throw error.statusCode?error:httpError(status,error.message);throw error;}
  }});
};
