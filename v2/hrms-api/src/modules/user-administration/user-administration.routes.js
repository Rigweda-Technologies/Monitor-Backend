import Joi from 'joi';
import mongoose from 'mongoose';
import { failure, httpError, success } from '../../plugins/errors.js';

const objectId=Joi.string().regex(/^[0-9a-fA-F]{24}$/);
const createSchema=Joi.object({ email:Joi.string().trim().lowercase().email().max(254).required(),password:Joi.string().min(6).required(),roleIds:Joi.array().items(Joi.string()).min(1).required(),firstName:Joi.string().trim().min(2).max(120).pattern(/^[A-Za-z ]+$/).required(),lastName:Joi.string().trim().min(2).max(120).pattern(/^[A-Za-z ]+$/).required(),departmentId:objectId.allow(null,''),designationId:objectId.allow(null,''),employmentType:Joi.string().valid('full_time','part_time','contract').required(),dateOfJoining:Joi.date().required(),managerId:objectId.allow(null,''),shiftId:objectId.allow(null,'') });
const envelope={type:'object',properties:{success:{type:'boolean'},code:{type:'integer'},message:{type:'string'},data:{},error:{}},required:['success','code','message','data','error']};
const validationEnvelope={type:'object',properties:{code:{type:'integer'},message:{type:'string'},data:{type:'null'},error:{type:'array'}},required:['code','message','data','error']};
const validate=schema=>(request,reply,done)=>{const {error,value}=schema.validate(request.body??{},{abortEarly:true});if(error)return reply.code(406).send({code:406,message:error.details[0].message,data:null,error:[]});request.body=value;done();};
export const registerUserAdministrationRoutes=async(app,{service,authenticate,authorize})=>{
  const routes=[
    {method:'GET',url:'/api/v2/users',permission:'USER_VIEW',summary:'List users in the active organization',operation:'list',status:200,message:'Users fetched successfully'},
    {method:'POST',url:'/api/v2/users/org-user',permission:'USER_CREATE',summary:'Create a user in the active organization',operation:'create',status:201,message:'User created successfully',validator:createSchema},
  ];
  for(const route of routes){
    const schema={tags:['User Administration'],summary:route.summary,security:[{bearerAuth:[]}],response:{[route.status]:envelope,400:envelope,401:envelope,403:envelope,404:envelope,406:validationEnvelope,409:envelope,500:envelope}};
    if(route.validator)schema.body={type:'object',additionalProperties:true,properties:{email:{type:'string',format:'email'},password:{type:'string',minLength:6},roleIds:{type:'array',minItems:1,items:{type:'string'}},firstName:{type:'string'},lastName:{type:'string'},departmentId:{type:['string','null']},designationId:{type:['string','null']},employmentType:{type:'string',enum:['full_time','part_time','contract']},dateOfJoining:{type:'string',format:'date-time'},managerId:{type:['string','null']},shiftId:{type:['string','null']}},required:['email','password','roleIds','firstName','lastName','employmentType','dateOfJoining']};
    if(route.operation==='list')schema.querystring={type:'object',properties:{page:{type:'string'},limit:{type:'string'},search:{type:'string'}}};
    app.route({method:route.method,url:route.url,schema,validatorCompiler:()=>data=>({value:data}),preValidation:[authenticate,async(request,reply)=>{const denied=await authorize(route.permission,request);if(denied)return reply.code(denied.code).send(failure(denied.code,denied.message));},...(route.validator?[validate(route.validator)]:[])],handler:async(request,reply)=>{
      try{const data=route.operation==='list'?await service.list({organizationId:request.user.organizationId,query:request.query}):await service.create({body:request.body,creator:request.user});return reply.code(route.status).send({...success(data,route.message),code:route.status});}
      catch(error){const status=Number(error.statusCode||error.code);if(Number.isInteger(status)&&status>=400&&status<=599)throw error.statusCode?error:httpError(status,error.message);throw error;}
    }});
  }
};
