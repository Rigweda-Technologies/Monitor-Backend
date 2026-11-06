import { failure, httpError, success } from '../../plugins/errors.js';

const envelope={type:'object',properties:{success:{type:'boolean'},code:{type:'integer'},message:{type:'string'},data:{},error:{}},required:['success','code','message','data','error']};
const query={type:'object',properties:{date:{type:'string'},limit:{type:'string'},offset:{type:'string'},appName:{type:'string'},processName:{type:'string'},employeeId:{type:'string'},browser:{type:'string'}}};
const routes=[
  {path:'/laptop-health',summary:'List the latest laptop health reports',message:'Laptop health fetched successfully',operation:'listLaptopHealth'},
  {path:'/employees',summary:'List employee activity for a local day',message:'Activity fetched successfully',operation:'listEmployees'},
  {path:'/apps',summary:'List application usage sessions',message:'App usage fetched successfully',operation:'listAppUsage'},
  {path:'/app-key-usage',summary:'List application key usage summaries',message:'App key usage fetched successfully',operation:'listAppKeyUsage'},
  {path:'/browser-history',summary:'List browser history',message:'Browser history fetched successfully',operation:'listBrowserHistory'},
];
export const registerActivityRoutes=async(app,{service,authenticate,authorize})=>{
  for(const route of routes)app.route({method:'GET',url:`/api/v2/activity${route.path}`,schema:{tags:['Activity'],summary:route.summary,security:[{bearerAuth:[]}],querystring:query,response:{200:envelope,401:envelope,403:envelope,500:envelope}},preValidation:[authenticate,async(request,reply)=>{const denied=await authorize('EMP_VIEW',request);if(denied)return reply.code(denied.code).send(failure(denied.code,denied.message));}],handler:async(request,reply)=>{
    const q=request.query||{},params={organizationId:request.user.organizationId};
    if(route.operation==='listLaptopHealth')params.organizationId=request.user.organizationId;
    else {params.date=typeof q.date==='string'?q.date:'';if(route.operation==='listAppUsage'||route.operation==='listBrowserHistory'){params.limit=Number.isFinite(Number(q.limit))?Number(q.limit):undefined;params.offset=Number.isFinite(Number(q.offset))?Number(q.offset):undefined;}if(route.operation==='listAppUsage'){params.appName=typeof q.appName==='string'?q.appName:'';params.processName=typeof q.processName==='string'?q.processName:'';}if(route.operation==='listAppUsage'||route.operation==='listAppKeyUsage'||route.operation==='listBrowserHistory')params.employeeId=typeof q.employeeId==='string'?q.employeeId:'';if(route.operation==='listBrowserHistory')params.browser=typeof q.browser==='string'?q.browser:'';}
    try{return reply.code(200).send({...success(await service[route.operation](params),route.message),code:200});}catch(error){const status=Number(error.statusCode||error.code);if(Number.isInteger(status)&&status>=400&&status<=599)throw error.statusCode?error:httpError(status,error.message);throw error;}
  }});
};
