import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { createEmployeeModels } from '../src/modules/employees/employee.models.js';
import { createExpenseModels } from '../src/modules/expenses/expense.models.js';
import { createExpenseService } from '../src/modules/expenses/expense.service.js';
import { registerExpenseRoutes } from '../src/modules/expenses/expense.routes.js';
import { createProjectModels } from '../src/modules/projects/project.models.js';
import { createProjectService } from '../src/modules/projects/project.service.js';
import { registerProjectRoutes } from '../src/modules/projects/project.routes.js';
import { createHiringModels } from '../src/modules/hiring/hiring.models.js';
import { createHiringService } from '../src/modules/hiring/hiring.service.js';
import { registerHiringRoutes } from '../src/modules/hiring/hiring.routes.js';
import { errorHandler } from '../src/plugins/errors.js';

const baseUri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const normalize = (value, knownIds = []) => {
  const stableIds = new Set(knownIds.map(String));
  const replacements = new Map();
  let sequence = 0;
  const generatedTimeFields = new Set(['createdAt','updatedAt','deletedAt','restoredAt','actionAt','reimbursedAt','uploadedAt','changedAt','offerLetterReleasedAt','rejectionEmailSentAt','lastRejectedAt','convertedAt']);
  const walk = (item, key = '') => {
    if (item === null || typeof item !== 'object') {
      if (generatedTimeFields.has(key)) return undefined;
      if (typeof item === 'string' && /^[a-f\d]{24}$/i.test(item) && !stableIds.has(item)) {
        if (!replacements.has(item)) replacements.set(item, `generated-${++sequence}`);
        return replacements.get(item);
      }
      return item;
    }
    if (Array.isArray(item)) return item.map(child => walk(child));
    const result = {};
    for (const [childKey, child] of Object.entries(item)) {
      if (generatedTimeFields.has(childKey)) continue;
      result[childKey] = walk(child, childKey);
    }
    return result;
  };
  return walk(JSON.parse(JSON.stringify(value)));
};

const cloneDatabaseUri = suffix => {
  const target = new URL(baseUri);
  target.pathname = `${target.pathname.replace(/\/$/, '')}_${suffix}`;
  return target.toString();
};

test('expenses, projects, and hiring real V1/V2 services preserve workflow responses and persisted effects', { skip: !baseUri }, async t => {
  assert.match(new URL(baseUri).pathname, /[_-](test|isolated|ci)([_-]|$)/i, 'database name must be explicitly isolated');
  const connectionOptions = { autoCreate:false, autoIndex:false, serverSelectionTimeoutMS:2000 };
  const v1Connection = await mongoose.createConnection(cloneDatabaseUri('v1_parity'), connectionOptions).asPromise();
  const v2Connection = await mongoose.createConnection(cloneDatabaseUri('v2_parity'), connectionOptions).asPromise();
  const v1Employees = createEmployeeModels(v1Connection);
  const v1Expenses = createExpenseModels(v1Connection);
  const v1Projects = createProjectModels(v1Connection);
  const v1Hiring = createHiringModels(v1Connection);
  const v2Employees = createEmployeeModels(v2Connection);
  const v2Expenses = createExpenseModels(v2Connection);
  const v2Projects = createProjectModels(v2Connection);
  const v2Hiring = createHiringModels(v2Connection);
  const orgId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const employeeId = new mongoose.Types.ObjectId();
  const identity = { userId:String(userId), _id:String(userId), organizationId:String(orgId) };
  const convertedUserId=new mongoose.Types.ObjectId(); const convertedEmployeeId=new mongoose.Types.ObjectId();
  const stableIds = [orgId,userId,employeeId,convertedUserId,convertedEmployeeId];
  const createConvertedOrgUser=employees=>async({email,firstName,lastName,employmentType,dateOfJoining})=>{
    await employees.Employee.create({_id:convertedEmployeeId,organizationId:orgId,userId:convertedUserId,firstName,lastName,employeeCode:'PARITY-HIRE-1',dateOfJoining:new Date(dateOfJoining),employmentType,status:'active'});
    return {userId:convertedUserId,email};
  };
  const uploadCalls = { v1:[], v2:[] };
  const mailCalls = { v1:[], v2:[] };
  const upload = bucket => async (data, options) => {
    uploadCalls[bucket].push({ data, options });
    return { public_id:'parity-receipt', secure_url:'https://files.example.test/parity-asset' };
  };
  const mail = bucket => async (...args) => { mailCalls[bucket].push(args); return true; };
  const auditV1 = async ({ req, module, action, entityId, before, after }) => v1Hiring.AuditLog.create({ organizationId:req.user.organizationId, userId:req.user.userId, module, action, entityId, before, after, ipAddress:req.ip, userAgent:req.headers?.['user-agent'] || '' });
  const legacyApp = createLegacyRouterHarness({
    mounts:[
      { path:'/api/v1/expenses',modulePath:'src/modules/expenses/expense.routes.js' },
      { path:'/api/v1/projects',modulePath:'src/modules/projects/project.routes.js' },
      { path:'/api/v1/hiring',modulePath:'src/modules/hiring/hiring.routes.js' },
    ],
    identity,
    sendMail:mail('v1'),
    overrides:{
      'src/modules/expenses/expense.model.js':v1Expenses.Expense,
      'src/modules/expenses/expenseVendor.model.js':v1Expenses.ExpenseVendor,
      'src/modules/projects/project.model.js':v1Projects.Project,
      'src/modules/hiring/hiringJob.model.js':v1Hiring.HiringJob,
      'src/modules/hiring/hiringCandidate.model.js':v1Hiring.HiringCandidate,
      'src/modules/employees/employee.model.js':v1Employees.Employee,
      'src/modules/organizations/organization.model.js':v1Hiring.Organization,
      'src/modules/auditLogs/auditLogs.service.js':{ audit:auditV1 },
      'src/config/cloudinary.js':{ uploadDataUri:upload('v1') },
      'src/modules/users/user.service.js':{ createOrgUser:createConvertedOrgUser(v1Employees) },
    },
  });
  let legacyServer;
  const app = Fastify({ logger:false });
  app.setErrorHandler(errorHandler);
  const expenseServiceV2 = createExpenseService(v2Expenses,{ uploadDataUri:upload('v2') });
  const projectServiceV2 = createProjectService(v2Projects,{ uploadDataUri:upload('v2') });
  const hiringServiceV2 = createHiringService(v2Hiring,{ sendMail:mail('v2'),createOrgUser:createConvertedOrgUser(v2Employees) });
  const authenticate = async request => { request.user = identity; };
  const authorize = async () => null;
  await registerExpenseRoutes(app,{ service:expenseServiceV2,authenticate,authorize });
  await registerProjectRoutes(app,{ service:projectServiceV2,authenticate,authorize });
  await registerHiringRoutes(app,{ service:hiringServiceV2,authenticate,authorize });

  t.after(async () => {
    await app.close();
    if (legacyServer) await new Promise(resolve => legacyServer.close(resolve));
    await Promise.allSettled([v1Connection.dropDatabase(),v2Connection.dropDatabase()]);
    await Promise.all([v1Connection.close(),v2Connection.close()]);
  });
  await Promise.all([
    v1Employees.Employee.create({ _id:employeeId,organizationId:orgId,userId,firstName:'Ada',lastName:'Lovelace',employeeCode:'PARITY-1',dateOfJoining:new Date('2020-01-01'),employmentType:'full_time',status:'active' }),
    v2Employees.Employee.create({ _id:employeeId,organizationId:orgId,userId,firstName:'Ada',lastName:'Lovelace',employeeCode:'PARITY-1',dateOfJoining:new Date('2020-01-01'),employmentType:'full_time',status:'active' }),
    v1Hiring.Organization.create({ _id:orgId,name:'Parity Org' }),
    v2Hiring.Organization.create({ _id:orgId,name:'Parity Org' }),
  ]);
  legacyServer = legacyApp.listen(0,'127.0.0.1');
  await new Promise(resolve => legacyServer.once('listening',resolve));
  const comparePaths = async (method,v1Path,v2Path,payload,v2Payload=payload) => {
    const v1Response = await fetch(`http://127.0.0.1:${legacyServer.address().port}/api/v1${v1Path}`,{ method,headers:{'content-type':'application/json'},body:payload === undefined ? undefined : JSON.stringify(payload) });
    const v2Response = await app.inject({ method,url:`/api/v2${v2Path}`,payload:v2Payload });
    const v1Body = await v1Response.json(); const v2Body = v2Response.json();
    assert.equal(v2Response.statusCode,v1Response.status,`${method} ${v1Path} status V1=${JSON.stringify(v1Body)} V2=${JSON.stringify(v2Body)}`);
    assert.deepEqual(normalize(v2Body,stableIds),normalize(v1Body,stableIds),`${method} ${v1Path} body`);
    return { v1:v1Body,v2:v2Body };
  };
  const compare = (method,path,payload) => comparePaths(method,path,path,payload);

  const expenseCreated = await compare('POST','/expenses/',{ category:'travel',title:'Parity Taxi',vendor:'Metro Cab',expenseDate:'2026-01-12T12:00:00.000Z',amount:25,taxAmount:2.5,reimbursementMethod:'payroll' });
  const expenseV1Id = expenseCreated.v1.data._id; const expenseV2Id = expenseCreated.v2.data._id;
  await comparePaths('PUT',`/expenses/${expenseV1Id}`,`/expenses/${expenseV2Id}`,{notes:'Updated during parity'});
  await comparePaths('PUT',`/expenses/${expenseV1Id}/action`,`/expenses/${expenseV2Id}/action`,{status:'approved'});
  const [v1ExpenseRow,v2ExpenseRow] = await Promise.all([
    v1Expenses.Expense.findById(expenseV1Id).lean(),v2Expenses.Expense.findById(expenseV2Id).lean(),
  ]);
  assert.deepEqual(normalize(v2ExpenseRow,stableIds),normalize(v1ExpenseRow,stableIds));
  await comparePaths('PUT',`/expenses/${expenseV1Id}`,`/expenses/${expenseV2Id}`,{notes:'approved expenses cannot be edited'});
  assert.equal(await v1Expenses.AuditLog.countDocuments({organizationId:orgId,module:'expenses'}),3);
  assert.equal(await v2Expenses.AuditLog.countDocuments({organizationId:orgId,module:'expenses'}),3);

  const receiptResponse = await compare('POST','/expenses/upload-receipt',{fileName:'receipt.pdf',fileData:'aGVsbG8gd29ybGQ='});
  assert.equal(receiptResponse.v1.data.fileName,'parity-receipt');

  await compare('GET','/expenses/?page=1&limit=20');
  await compare('GET','/expenses/summary');
  await compare('GET','/expenses/employees');
  const vendorsBefore = await compare('GET','/expenses/vendors');
  assert.deepEqual(vendorsBefore.v1.data,[]);
  const vendorCreated = await compare('POST','/expenses/vendors',{name:'Parity Vendor'});
  const vendorV1Id = vendorCreated.v1.data._id; const vendorV2Id = vendorCreated.v2.data._id;
  const vendorExpensePayload = (vendorId) => ({category:'software',title:'Parity Subscription',vendorId,expenseDate:'2026-02-03T12:00:00.000Z',amount:18,taxAmount:1.8,reimbursementMethod:'none'});
  const vendorExpense = await comparePaths('POST','/expenses/','/expenses/',vendorExpensePayload(vendorV1Id),vendorExpensePayload(vendorV2Id));
  const vendorExpenseV1Id = vendorExpense.v1.data._id; const vendorExpenseV2Id = vendorExpense.v2.data._id;
  const vendorUpdated = await comparePaths('PUT',`/expenses/vendors/${vendorV1Id}`,`/expenses/vendors/${vendorV2Id}`,{name:'Parity Vendor Updated',isActive:true});
  assert.equal(vendorUpdated.v1.data.name,'Parity Vendor Updated');
  assert.equal((await v1Expenses.Expense.findById(vendorExpenseV1Id).lean()).vendor,'Parity Vendor Updated');
  assert.equal((await v2Expenses.Expense.findById(vendorExpenseV2Id).lean()).vendor,'Parity Vendor Updated');
  await comparePaths('PUT',`/expenses/${expenseV1Id}/reimbursement`,`/expenses/${expenseV2Id}/reimbursement`,{reimbursementStatus:'paid',reimbursementPayrollMonth:'2026-01',reimbursementNote:'Reconciled'});
  await compare('GET','/expenses/?category=software&status=pending&page=1&limit=10');
  await compare('GET','/expenses/summary?category=software');
  await comparePaths('DELETE',`/expenses/${vendorExpenseV1Id}`,`/expenses/${vendorExpenseV2Id}`);
  await compare('GET','/expenses/?includeDeleted=true&category=software');
  await comparePaths('PUT',`/expenses/${vendorExpenseV1Id}/restore`,`/expenses/${vendorExpenseV2Id}/restore`);
  await comparePaths('DELETE',`/expenses/${vendorExpenseV1Id}`,`/expenses/${vendorExpenseV2Id}`);
  await comparePaths('DELETE',`/expenses/vendors/${vendorV1Id}`,`/expenses/vendors/${vendorV2Id}`);
  assert.equal(await v1Expenses.Expense.findById(vendorExpenseV1Id).lean().then(row=>row.isDeleted),true);
  assert.equal(await v2Expenses.Expense.findById(vendorExpenseV2Id).lean().then(row=>row.isDeleted),true);
  assert.equal(await v1Expenses.ExpenseVendor.findById(vendorV1Id),null);
  assert.equal(await v2Expenses.ExpenseVendor.findById(vendorV2Id),null);

  const projectCreated = await compare('POST','/projects/',{projectName:'Parity Site',clientName:'Parity Client',actualAmount:120,discountedAmount:100,paidAmount:25,paidTo:String(employeeId),mouUpload:{fileName:'agreement.pdf',mimeType:'application/pdf',base64Data:'eA=='}});
  const projectV1Id = projectCreated.v1.data._id; const projectV2Id = projectCreated.v2.data._id;
  await compare('GET','/projects/');
  await compare('GET','/projects/employees');
  await comparePaths('GET',`/projects/${projectV1Id}`,`/projects/${projectV2Id}`);
  const projectUpdated = await comparePaths('PUT',`/projects/${projectV1Id}`,`/projects/${projectV2Id}`,{notes:'Updated project'});
  assert.equal(projectUpdated.v1.data.pendingAmount,75);
  assert.equal((await v2Projects.Project.findById(projectV2Id).lean()).pendingAmount,75);
  await comparePaths('DELETE',`/projects/${projectV1Id}`,`/projects/${projectV2Id}`);
  assert.equal((await v1Projects.Project.collection.findOne({_id:new mongoose.Types.ObjectId(projectV1Id)})).isDeleted,true);
  assert.equal((await v2Projects.Project.collection.findOne({_id:new mongoose.Types.ObjectId(projectV2Id)})).isDeleted,true);
  assert.equal(await v1Projects.AuditLog.countDocuments({organizationId:orgId,module:'projects'}),3);
  assert.equal(await v2Projects.AuditLog.countDocuments({organizationId:orgId,module:'projects'}),3);

  const jobCreated = await compare('POST','/hiring/jobs',{title:'Parity Engineer',department:'Platform',location:'Remote'});
  const jobV1Id=jobCreated.v1.data._id; const jobV2Id=jobCreated.v2.data._id;
  await compare('GET','/hiring/overview');
  await compare('GET','/hiring/employees');
  await compare('GET','/hiring/jobs?status=open');
  await comparePaths('PUT',`/hiring/jobs/${jobV1Id}`,`/hiring/jobs/${jobV2Id}`,{description:'Parity role updated',openings:2});
  const candidatePayload = jobId => ({jobId,firstName:'Rae',lastName:'Parity',email:'rae.parity@example.com',expectedCTC:1200000,keySkills:['Node.js','PostgreSQL']});
  const candidateV1Response = await fetch(`http://127.0.0.1:${legacyServer.address().port}/api/v1/hiring/candidates`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(candidatePayload(jobCreated.v1.data._id))});
  const candidateV1Body = await candidateV1Response.json();
  const candidateV2 = await app.inject({method:'POST',url:'/api/v2/hiring/candidates',payload:candidatePayload(jobCreated.v2.data._id)});
  assert.equal(candidateV2.statusCode,candidateV1Response.status);
  assert.equal(candidateV2.statusCode,201,JSON.stringify(candidateV2.json()));
  assert.deepEqual(normalize(candidateV2.json(),stableIds),normalize(candidateV1Body,stableIds));
  const candidateV1Id = candidateV1Body.data._id; const candidateV2Id = candidateV2.json().data._id;
  await comparePaths('GET',`/hiring/candidates?jobId=${jobV1Id}&stage=applied`,`/hiring/candidates?jobId=${jobV2Id}&stage=applied`);
  await comparePaths('PUT',`/hiring/candidates/${candidateV1Id}`,`/hiring/candidates/${candidateV2Id}`,{remarks:'Screening notes',rating:4,assignedTo:String(employeeId)});
  const interviewPayload={roundName:'Technical',interviewerEmployeeId:String(employeeId),scheduledAt:'2026-12-01T10:00:00.000Z',mode:'virtual',meetingLink:'https://meet.example.test/parity'};
  const interview=await comparePaths('POST',`/hiring/candidates/${candidateV1Id}/interviews`,`/hiring/candidates/${candidateV2Id}/interviews`,interviewPayload);
  const interviewV1Id=interview.v1.data.interviews[0]._id; const interviewV2Id=interview.v2.data.interviews[0]._id;
  await comparePaths('PUT',`/hiring/candidates/${candidateV1Id}/interviews/${interviewV1Id}/feedback`,`/hiring/candidates/${candidateV2Id}/interviews/${interviewV2Id}/feedback`,{feedback:'Strong technical round',communication:4,technical:5,problemSolving:4,cultureFit:4,overall:4,recommendation:'hire'});
  await comparePaths('PUT',`/hiring/candidates/${candidateV1Id}/stage`,`/hiring/candidates/${candidateV2Id}/stage`,{stage:'offer',note:'Approved'});
  await comparePaths('POST',`/hiring/candidates/${candidateV1Id}/release-offer-letter`,`/hiring/candidates/${candidateV2Id}/release-offer-letter`,{});
  await comparePaths('PUT',`/hiring/candidates/${candidateV1Id}/stage`,`/hiring/candidates/${candidateV2Id}/stage`,{stage:'hired',note:'Accepted offer'});
  const conversionPayload={password:'parity-password',roleIds:[String(new mongoose.Types.ObjectId())],departmentId:String(new mongoose.Types.ObjectId()),designationId:String(new mongoose.Types.ObjectId()),employmentType:'full_time',dateOfJoining:'2026-12-15T00:00:00.000Z'};
  const converted=await comparePaths('POST',`/hiring/candidates/${candidateV1Id}/convert-to-employee`,`/hiring/candidates/${candidateV2Id}/convert-to-employee`,conversionPayload);
  assert.equal(String(converted.v1.data.employeeId),String(convertedEmployeeId));
  assert.equal(String(converted.v2.data.userId),String(convertedUserId));
  assert.ok(await v1Employees.Employee.findOne({userId:convertedUserId,organizationId:orgId}));
  assert.ok(await v2Employees.Employee.findOne({userId:convertedUserId,organizationId:orgId}));

  const rejectedPayload={...candidatePayload(jobV1Id),email:'rejected.parity@example.com'};
  const rejectedV1=await fetch(`http://127.0.0.1:${legacyServer.address().port}/api/v1/hiring/candidates`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(rejectedPayload)});
  const rejectedV1Body=await rejectedV1.json();
  const rejectedV2=await app.inject({method:'POST',url:'/api/v2/hiring/candidates',payload:{...candidatePayload(jobV2Id),email:'rejected.parity@example.com'}});
  assert.equal(rejectedV2.statusCode,rejectedV1.status);
  assert.deepEqual(normalize(rejectedV2.json(),stableIds),normalize(rejectedV1Body,stableIds));
  const rejectedV1Id=rejectedV1Body.data._id; const rejectedV2Id=rejectedV2.json().data._id;
  await comparePaths('PUT',`/hiring/candidates/${rejectedV1Id}/stage`,`/hiring/candidates/${rejectedV2Id}/stage`,{stage:'rejected',note:'Not selected'});
  await comparePaths('POST',`/hiring/candidates/${rejectedV1Id}/send-rejection-email`,`/hiring/candidates/${rejectedV2Id}/send-rejection-email`,{note:'Thank you for applying'});
  await comparePaths('DELETE',`/hiring/candidates/${rejectedV1Id}`,`/hiring/candidates/${rejectedV2Id}`);
  await comparePaths('DELETE',`/hiring/jobs/${jobV1Id}`,`/hiring/jobs/${jobV2Id}`);
  assert.equal((await v1Hiring.HiringJob.collection.findOne({_id:new mongoose.Types.ObjectId(jobV1Id)})).isDeleted,true);
  assert.equal((await v2Hiring.HiringJob.collection.findOne({_id:new mongoose.Types.ObjectId(jobV2Id)})).isDeleted,true);
  assert.equal(mailCalls.v1.length,2); assert.equal(mailCalls.v2.length,2);
  assert.deepEqual(mailCalls.v2,mailCalls.v1);
  assert.equal(await v1Hiring.AuditLog.countDocuments({organizationId:orgId,module:'hiring'}),15);
  assert.equal(await v2Hiring.AuditLog.countDocuments({organizationId:orgId,module:'hiring'}),15);
  assert.equal(uploadCalls.v1.length,2,JSON.stringify(uploadCalls.v1)); assert.equal(uploadCalls.v2.length,2,JSON.stringify(uploadCalls.v2));
  assert.deepEqual(uploadCalls.v2.map(({data,options})=>({data,options:{folder:options.folder,resource_type:options.resource_type}})),uploadCalls.v1.map(({data,options})=>({data,options:{folder:options.folder,resource_type:options.resource_type}})));
});
