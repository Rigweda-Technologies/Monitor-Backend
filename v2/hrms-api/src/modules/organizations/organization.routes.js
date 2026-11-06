import Joi from 'joi';
import { failure, httpError, success } from '../../plugins/errors.js';

const name = Joi.string().trim().min(2).max(120).pattern(/^[A-Za-z ]+$/).messages({ 'string.pattern.base':'Only letters and spaces are allowed' });
const code = Joi.string().trim().uppercase().min(2).max(20).pattern(/^[A-Z0-9_-]+$/).messages({ 'string.pattern.base':'Only A-Z, 0-9, _ and - are allowed' });
const createSchema = Joi.object({ name:name.required(), code:code.required(), timezone:Joi.string().required(), currency:Joi.string().required(), adminUserId:Joi.string(), adminRoleId:Joi.string() });
const updateSchema = Joi.object({ name, code, timezone:Joi.string(), currency:Joi.string(), status:Joi.string().valid('active','inactive') });
const lifecycleSchema = Joi.object({ action:Joi.string().valid('soft_delete','restore','hard_delete').required(), confirmationCode:Joi.string().trim().required() });
const payrollSchema = Joi.object({ mode:Joi.string().valid('generated','all').default('generated'), confirmationCode:Joi.string().trim().required() });
const envelope = { type:'object', properties:{ success:{type:'boolean'},code:{type:'integer'},message:{type:'string'},data:{},error:{} },required:['success','code','message','data','error'] };
const validationEnvelope = { type:'object', properties:{ code:{type:'integer'},message:{type:'string'},data:{type:'null'},error:{type:'array'} },required:['code','message','data','error'] };
const bodySchema = (properties, required) => ({ type:'object', properties, additionalProperties:true, ...(required?{required}:{}) });
const objectId = { type:'string', pattern:'^[a-fA-F0-9]{24}$' };
const idParams = { type:'object', properties:{ id:objectId }, required:['id'] };
const validate = schema => (request,reply,done) => { const {error,value}=schema.validate(request.body??{},{abortEarly:true}); if(error)return reply.code(406).send({code:406,message:error.details[0].message,data:null,error:[]}); request.body=value; done(); };

export const registerOrganizationRoutes = async (app,{service,authenticate,authorize}) => {
  const routes=[
    {method:'POST',path:'/',permission:'ORG_MANAGE',summary:'Create an organization',status:201,message:'Organization created successfully',operation:'create',validator:createSchema,body:{name:{type:'string',minLength:2,maxLength:120},code:{type:'string',minLength:2,maxLength:20},timezone:{type:'string'},currency:{type:'string'},adminUserId:{type:'string'},adminRoleId:{type:'string'}},required:['name','code','timezone','currency']},
    {method:'PUT',path:'/:id',permission:'ORG_MANAGE',summary:'Update an organization',status:200,message:'Organization updated successfully',operation:'update',validator:updateSchema,body:{name:{type:'string'},code:{type:'string'},timezone:{type:'string'},currency:{type:'string'},status:{type:'string',enum:['active','inactive']}},params:idParams},
    {method:'GET',path:'/:id',permission:'ORG_VIEW',summary:'Get an organization',status:200,message:'Organization fetched successfully',operation:'getById',params:idParams},
    {method:'GET',path:'/',permission:'ORG_VIEW',summary:'List organizations',status:200,message:'Organizations fetched successfully',operation:'list'},
    {method:'DELETE',path:'/:id',permission:'ORG_MANAGE',summary:'Deactivate an organization',status:200,message:'Organization deactivated successfully',operation:'remove',params:idParams,empty:true},
    {method:'POST',path:'/:id/lifecycle',permission:'ORG_MANAGE',summary:'Apply an organization lifecycle action',status:200,message:'Organization lifecycle action completed',operation:'lifecycleAction',validator:lifecycleSchema,body:{action:{type:'string',enum:['soft_delete','restore','hard_delete']},confirmationCode:{type:'string'}},required:['action','confirmationCode'],params:idParams},
    {method:'POST',path:'/:id/payroll-clear',permission:'ORG_MANAGE',summary:'Clear organization payroll data',status:200,message:'Organization payroll data cleared successfully',operation:'clearPayrollData',validator:payrollSchema,body:{mode:{type:'string',enum:['generated','all'],default:'generated'},confirmationCode:{type:'string'}},required:['confirmationCode'],params:idParams},
  ];
  for(const route of routes){
    const schema={tags:['Organizations'],summary:route.summary,security:[{bearerAuth:[]}],response:{[route.status]:envelope,400:envelope,401:envelope,403:envelope,404:envelope,406:validationEnvelope,500:envelope}};
    if(route.body)schema.body=bodySchema(route.body,route.required);
    if(route.params)schema.params=route.params;
    app.route({method:route.method,url:`/api/v2/organizations${route.path}`,schema,validatorCompiler:()=>data=>({value:data}),preValidation:[authenticate,async(request,reply)=>{const denied=await authorize(route.permission,request);if(denied)return reply.code(denied.code).send(failure(denied.code,denied.message));},...(route.validator?[validate(route.validator)]:[])],handler:async(request,reply)=>{
      try{
        const result=route.operation==='create'?await service.create({body:request.body,user:request.user}):route.operation==='update'?await service.update(request.params.id,request.body):route.operation==='getById'?await service.getById(request.params.id):route.operation==='list'?await service.list({user:request.user}):route.operation==='remove'?await service.remove(request.params.id):route.operation==='lifecycleAction'?await service.lifecycleAction({organizationId:request.params.id,...request.body,actorUserId:request.user.userId}):await service.clearPayrollData({organizationId:request.params.id,...request.body,actorUserId:request.user.userId});
        return reply.code(route.status).send({ ...success(route.empty?undefined:result,route.message),code:route.status });
      }catch(error){const status=Number(error.statusCode||error.code);if(Number.isInteger(status)&&status>=400&&status<=599)throw error.statusCode?error:httpError(status,error.message);throw error;}
    }});
  }
};
