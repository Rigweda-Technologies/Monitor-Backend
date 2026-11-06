import { failure, success, httpError } from '../../plugins/errors.js';
import { DOCUMENT_CATEGORIES } from './organization-document.catalog.js';
import { listQuerySchema, reportQuerySchema, uploadBodySchema, updateBodySchema } from './organization-document.service.js';

const envelope = { type:'object', properties:{ success:{type:'boolean'},code:{type:'integer'},message:{type:'string'},data:{},error:{} }, required:['success','code','message','data','error'], additionalProperties:true };
const validationEnvelope = { type:'object', properties:{ code:{type:'integer'},message:{type:'string'},data:{type:'null'},error:{type:'array'} }, required:['code','message','data','error'] };
const querySchema = properties => ({ type:'object',properties,additionalProperties:true });
const booleanQuery = { anyOf:[{type:'boolean'},{type:'string',enum:['true','false']}] };
const listProperties = { category:{type:'string',enum:DOCUMENT_CATEGORIES},status:{type:'string',enum:['ACTIVE','EXPIRED','PENDING']},search:{type:'string',maxLength:120},includeHistory:booleanQuery,esicApplicable:booleanQuery };
const reportProperties = { days:{type:'integer',minimum:1,maximum:365},esicApplicable:booleanQuery };
const paramSchema = { type:'object',properties:{id:{type:'string',pattern:'^[a-fA-F0-9]{24}$'}},required:['id'],additionalProperties:false };
const bodySchema = { type:'object',additionalProperties:false,properties:{
  documentKey:{type:'string',enum:['COMPANY_PAN','GST_CERTIFICATE','CERTIFICATE_OF_INCORPORATION','TAN_ALLOTMENT','SHOP_ESTABLISHMENT','MSME_CERTIFICATE','PF_REGISTRATION','PF_ESTABLISHMENT_CODE','ESIC_REGISTRATION','PT_REGISTRATION','CANCELLED_CHEQUE','BANK_ACCOUNT_PROOF','AUTHORIZED_SIGNATORY','SALARY_STRUCTURE_POLICY','LEAVE_POLICY','ATTENDANCE_POLICY','EMPLOYEE_HANDBOOK','OFFER_LETTER_TEMPLATES','PAYSLIP_TEMPLATE']},documentNumber:{type:'string',maxLength:80},expiryDate:{anyOf:[{type:'string',format:'date-time'},{type:'null'}]},remarks:{type:'string',maxLength:500},
  file:{type:'object',additionalProperties:false,properties:{fileName:{type:'string',maxLength:180},mimeType:{type:'string',enum:['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document']},size:{type:'integer',minimum:1,maximum:8388608},base64Data:{type:'string'}},required:['fileName','mimeType','size','base64Data']},
},required:['documentKey','file'] };
const updateSchema = { type:'object',additionalProperties:false,properties:{documentNumber:{type:'string',maxLength:80},expiryDate:{anyOf:[{type:'string',format:'date-time'},{type:'null'}]},remarks:{type:'string',maxLength:500}} };
const validate = (joiSchema, source) => async (request, reply) => {
  const { error,value } = joiSchema.validate(request[source] || {}, { abortEarly:true,convert:true });
  if (error) return reply.code(406).send({code:406,message:error.details[0].message,data:null,error:[]});
  if (source === 'body') request.body = value;
  else Object.assign(request.query,value);
};
const checkPermission = (authorize,permission) => async (request,reply) => {
  const denied = await authorize(permission,request);
  if (denied) return reply.code(denied.code).send(failure(denied.code,denied.message));
};

export const registerOrganizationDocumentRoutes = (app,{ service,authenticate,authorize,fetchImpl=globalThis.fetch }) => {
  const auth = authenticate;
  const routes = [
    ['GET','/catalog','ORG_DOCUMENT_VIEW|ORG_SETTINGS_VIEW|PAYROLL_REPORT_VIEW','Get organization document catalog','catalog',200,'Success','list'],
    ['GET','/summary','ORG_DOCUMENT_VIEW|ORG_SETTINGS_VIEW|PAYROLL_REPORT_VIEW','Get organization document summary','summary',200,'Success','report'],
    ['GET','/reports/missing','ORG_DOCUMENT_VIEW|ORG_DOCUMENT_REPORT_VIEW|PAYROLL_REPORT_VIEW','List missing mandatory documents','missing',200,'Success','report'],
    ['GET','/reports/expiring-soon','ORG_DOCUMENT_VIEW|ORG_DOCUMENT_REPORT_VIEW|PAYROLL_REPORT_VIEW','List documents expiring soon','expiringSoon',200,'Success','report'],
    ['GET','/','ORG_DOCUMENT_VIEW|ORG_SETTINGS_VIEW|PAYROLL_REPORT_VIEW','List organization documents','list',200,'Success','list'],
    ['POST','/upload','ORG_DOCUMENT_UPLOAD|ORG_SETTINGS_MANAGE|PAYROLL_CONFIG_MANAGE','Upload or replace an organization document','upload',200,'Document uploaded','upload'],
    ['PATCH','/:id','ORG_DOCUMENT_UPLOAD|ORG_SETTINGS_MANAGE|PAYROLL_CONFIG_MANAGE','Update organization document metadata','updateMetadata',200,'Document updated','update'],
    ['GET','/:id/access','ORG_DOCUMENT_VIEW|ORG_SETTINGS_VIEW|PAYROLL_REPORT_VIEW','Get organization document metadata','access',200,'Success','id'],
    ['GET','/:id/preview','ORG_DOCUMENT_VIEW|ORG_SETTINGS_VIEW|PAYROLL_REPORT_VIEW','Preview an organization document','preview',200,'Success','id'],
    ['GET','/:id/download','ORG_DOCUMENT_VIEW|ORG_SETTINGS_VIEW|PAYROLL_REPORT_VIEW','Download an organization document','download',200,'Success','id'],
    ['DELETE','/:id','ORG_DOCUMENT_DELETE|ORG_SETTINGS_MANAGE|PAYROLL_CONFIG_MANAGE','Delete an organization document','delete',200,'Document deleted','id'],
  ];
  for (const [method,path,permission,summary,operation,status,message,input] of routes) {
    const schema = { tags:['Organization Documents'],summary,security:[{bearerAuth:[]}],response:{[status]:envelope,401:envelope,403:envelope,404:envelope,406:validationEnvelope,413:envelope,502:envelope,500:envelope} };
    if(input==='list') schema.querystring=querySchema(listProperties);
    if(input==='report') schema.querystring=querySchema(reportProperties);
    if(input==='upload') schema.body=bodySchema;
    if(input==='update') { schema.params=paramSchema; schema.body=updateSchema; }
    if(input==='id') schema.params=paramSchema;
    const permissions=permission.split('|');
    const preValidation=[auth,checkPermission(authorize,permissions.length===1?permissions[0]:permissions)];
    if(input==='list') preValidation.push(validate(listQuerySchema,'query'));
    if(input==='report') preValidation.push(validate(reportQuerySchema,'query'));
    if(input==='upload') preValidation.push(validate(uploadBodySchema,'body'));
    if(input==='update') preValidation.push(validate(updateBodySchema,'body'));
    app.route({method,url:`/api/v2/organization-documents${path}`,schema,preValidation,handler:async(request,reply)=>{
      if(operation==='preview'||operation==='download') {
        const result=await service.streamAccess(request,operation);
        let remote;
        try { remote=await fetchImpl(result.url,{redirect:'follow'}); } catch { throw httpError(502,'Unable to fetch document'); }
        if(!remote.ok) return reply.code(remote.status).send(failure(remote.status,'Unable to fetch document'));
        const disposition=operation==='download'?'attachment':'inline';
        reply.header('Content-Type',remote.headers.get('content-type')||'application/octet-stream');
        reply.header('Cache-Control','private, no-store, max-age=0');
        reply.header('Content-Disposition',`${disposition}; filename="${String(result.doc.fileName||'document').replaceAll('"','')}"`);
        return reply.send(remote.body);
      }
      const data=await service[operation](request);
      return reply.code(status).send(success(data,message));
    }});
  }
};
