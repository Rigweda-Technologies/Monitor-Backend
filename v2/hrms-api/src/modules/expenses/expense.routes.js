import { failure, success } from '../../plugins/errors.js';
import { createExpenseSchema, updateExpenseSchema, listExpensesQuerySchema, actionExpenseSchema, updateReimbursementSchema, uploadReceiptSchema, createVendorSchema, updateVendorSchema } from './expense.validation.js';

const envelope = { type:'object',properties:{ success:{type:'boolean'},code:{type:'integer'},message:{type:'string'},data:{},error:{} },required:['success','code','message','data','error'] };
const validationEnvelope = { type:'object',properties:{ code:{type:'integer'},message:{type:'string'},data:{type:'null'},error:{type:'array'} },required:['code','message','data','error'],additionalProperties:false };
const objectIdParam = (name='id') => ({ type:'object',properties:{ [name]:{type:'string',pattern:'^[a-fA-F0-9]{24}$'} },required:[name] });
const expenseProps = { category:{type:'string'},title:{type:'string',minLength:2,maxLength:120},vendorId:{type:['string','null']},vendor:{type:'string',maxLength:120},expenseDate:{type:'string',format:'date-time'},amount:{type:'number',minimum:0},taxAmount:{type:'number',minimum:0},paymentMode:{type:'string'},reimbursementMethod:{type:'string'},purchasedBy:{type:['string','null']},reimbursementAmount:{type:'number',minimum:0},reimbursementPayrollMonth:{type:'string',maxLength:20},reimbursementNote:{type:'string',maxLength:500},notes:{type:'string',maxLength:1000},receiptUrl:{type:'string',maxLength:500} };
const querySchema = { type:'object',properties:{ category:{type:'string'},status:{type:'string'},includeDeleted:{type:'string',enum:['true','false']},startDate:{type:'string',format:'date-time'},endDate:{type:'string',format:'date-time'},employeeId:{type:'string',pattern:'^[a-fA-F0-9]{24}$'},reimbursementStatus:{type:'string'},page:{type:'integer',minimum:1},limit:{type:'integer',minimum:1,maximum:200} } };
const validate = (joiSchema, property) => (request,reply,done) => {
  const { error,value } = joiSchema.validate(request[property] ?? {},{abortEarly:true});
  if (error) return reply.code(406).send({ code:406,message:error.details?.[0]?.message || 'Validation failed',data:null,error:[] });
  request[property] = value; done();
};

export const registerExpenseRoutes = async (app,{ service,authenticate,authorize,cache = {} }) => {
  const list = async (operation,request,namespace,ttl) => {
    if (typeof cache.withCache !== 'function') return service[operation](request);
    const key = cache.buildRequestCacheKey ? cache.buildRequestCacheKey(request) : `${request.user.organizationId}:${JSON.stringify(request.query)}`;
    return cache.withCache({ namespace,key,ttlSeconds:ttl,producer:() => service[operation](request) });
  };
  const invalidate = async () => {
    if (typeof cache.invalidateCacheNamespace !== 'function') return;
    await Promise.all(['expenses:list','expenses:summary','expenses:vendors'].map(namespace => cache.invalidateCacheNamespace(namespace)));
  };
  const routes = [
    {method:'POST',path:'/',permission:'EXPENSE_MANAGE',summary:'Create an expense',operation:'createExpense',status:201,message:'Expense created',validator:createExpenseSchema,body:{type:'object',properties:expenseProps,required:['category','title','expenseDate','amount'],additionalProperties:false},invalidate:true},
    {method:'GET',path:'/',permission:['EXPENSE_VIEW','EXPENSE_MANAGE'],summary:'List expenses',operation:'listExpenses',status:200,message:'Success',validator:listExpensesQuerySchema,querystring:querySchema,cache:['expenses:list',60]},
    {method:'GET',path:'/summary',permission:['EXPENSE_VIEW','EXPENSE_MANAGE'],summary:'Get expense summary',operation:'getSummary',status:200,message:'Success',validator:listExpensesQuerySchema,querystring:querySchema,cache:['expenses:summary',120]},
    {method:'GET',path:'/employees',permission:['EXPENSE_VIEW','EXPENSE_MANAGE'],summary:'List expense employees',operation:'listExpenseEmployees',status:200,message:'Success'},
    {method:'POST',path:'/upload-receipt',permission:'EXPENSE_MANAGE',summary:'Upload an expense receipt',operation:'uploadReceipt',status:200,message:'Receipt uploaded',validator:uploadReceiptSchema,body:{type:'object',properties:{fileName:{type:'string',minLength:1,maxLength:255},fileData:{type:'string',minLength:10}},required:['fileName','fileData'],additionalProperties:false}},
    {method:'GET',path:'/vendors',permission:['EXPENSE_VIEW','EXPENSE_MANAGE'],summary:'List expense vendors',operation:'listVendors',status:200,message:'Success',cache:['expenses:vendors',300]},
    {method:'POST',path:'/vendors',permission:'EXPENSE_MANAGE',summary:'Create an expense vendor',operation:'createVendor',status:201,message:'Vendor created',validator:createVendorSchema,body:{type:'object',properties:{name:{type:'string',minLength:2,maxLength:120,pattern:'^[A-Za-z ]+$'},isActive:{type:'boolean'}},required:['name'],additionalProperties:false},invalidate:true},
    {method:'PUT',path:'/vendors/:vendorId',permission:'EXPENSE_MANAGE',summary:'Update an expense vendor',operation:'updateVendor',status:200,message:'Vendor updated',validator:updateVendorSchema,params:objectIdParam('vendorId'),body:{type:'object',properties:{name:{type:'string',minLength:2,maxLength:120,pattern:'^[A-Za-z ]+$'},isActive:{type:'boolean'}},additionalProperties:false},invalidate:true},
    {method:'DELETE',path:'/vendors/:vendorId',permission:'EXPENSE_MANAGE',summary:'Delete an expense vendor',operation:'removeVendor',status:200,message:'Vendor deleted',params:objectIdParam('vendorId'),invalidate:true},
    {method:'PUT',path:'/:id',permission:'EXPENSE_MANAGE',summary:'Update an expense',operation:'updateExpense',status:200,message:'Expense updated',validator:updateExpenseSchema,params:objectIdParam(),body:{type:'object',properties:expenseProps,additionalProperties:false},invalidate:true},
    {method:'DELETE',path:'/:id',permission:'EXPENSE_MANAGE',summary:'Delete an expense',operation:'removeExpense',status:200,message:'Expense deleted',params:objectIdParam(),invalidate:true},
    {method:'PUT',path:'/:id/action',permission:'EXPENSE_ACTION',summary:'Approve or reject an expense',operation:'actionExpense',status:200,message:'action',validator:actionExpenseSchema,params:objectIdParam(),body:{type:'object',properties:{status:{type:'string',enum:['approved','rejected']},rejectionReason:{type:'string',minLength:3,maxLength:500}},required:['status'],additionalProperties:false},invalidate:true},
    {method:'PUT',path:'/:id/reimbursement',permission:'EXPENSE_MANAGE',summary:'Update expense reimbursement status',operation:'updateReimbursement',status:200,message:'Reimbursement updated',validator:updateReimbursementSchema,params:objectIdParam(),body:{type:'object',properties:{reimbursementStatus:{type:'string',enum:['pending','queued','paid']},reimbursementPayrollMonth:{type:'string',maxLength:20},reimbursementNote:{type:'string',maxLength:500}},required:['reimbursementStatus'],additionalProperties:false},invalidate:true},
    {method:'PUT',path:'/:id/restore',permission:'EXPENSE_MANAGE',summary:'Restore a deleted expense',operation:'restoreExpense',status:200,message:'Expense restored',params:objectIdParam(),invalidate:true},
  ];
  for (const route of routes) {
    const schema = { tags:['Expenses'],summary:route.summary,security:[{bearerAuth:[]}],response:{[route.status]:envelope,400:envelope,401:envelope,403:envelope,406:validationEnvelope,500:envelope} };
    if (route.body) schema.body = route.body; if (route.querystring) schema.querystring = route.querystring; if (route.params) schema.params = route.params;
    app.route({ method:route.method,url:`/api/v2/expenses${route.path}`,schema,validatorCompiler:() => data => ({value:data}),preValidation:[authenticate,async (request,reply) => { const denied = await authorize(route.permission,request); if (denied) return reply.code(denied.code).send(failure(denied.code,denied.message)); },...(route.validator ? [validate(route.validator,route.method === 'GET' ? 'query' : 'body')] : [])],handler:async (request,reply) => {
      let data = route.cache ? await list(route.operation,request,route.cache[0],route.cache[1]) : await service[route.operation](request);
      if (route.invalidate) await invalidate();
      const message = route.message === 'action' ? `Expense ${request.body.status}` : route.message;
      return reply.code(route.status).send(success(data,message));
    }});
  }
};
