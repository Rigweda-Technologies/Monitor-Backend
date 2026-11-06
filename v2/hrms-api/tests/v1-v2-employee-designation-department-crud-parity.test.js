import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { createRuntime } from '../src/runtime.js';
import { createTokens } from '../src/integrations/tokens.js';
import { loadConfig } from '../src/config/env.js';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';

const configuredUrl=process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const repoRoot=new URL('../../../',import.meta.url).pathname;
const legacyRequire=createRequire(`${repoRoot}hrms/back-end/package.json`);
const normalize=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='_id'&&item?'<id>':(/(?:^|_)id$/i.test(key)||['organizationId','userId','employeeId','employeeIds','departmentId','designationId','managerId','roleIds'].includes(key))&&item?Array.isArray(item)?item.map(()=>'<id>'):/^[a-f0-9]{24}$/i.test(String(item))?'<id>':item:['createdAt','updatedAt','probationStartDate','probationEndDate','noticeStartDate','noticeEndDate'].includes(key)&&item?'<timestamp>':item));
const parseLegacy=async response=>({status:response.status,headers:response.headers,body:JSON.parse(await response.text())});
const parseV2=response=>({status:response.statusCode,headers:response.headers,body:response.json()});
const compare=(a,b,label)=>{assert.equal(a.status,b.status,`${label} status: ${JSON.stringify({v1:a.body,v2:b.body})}`);assert.equal((a.headers.get?.('content-type')||a.headers['content-type']||'').split(';')[0],(b.headers['content-type']||'').split(';')[0],`${label} content type`);assert.deepEqual(normalize(a.body),normalize(b.body),label);};

test('real V1 and V2 employee, designation and department CRUD contracts match on separate isolated Mongo databases',{skip:!configuredUrl},async t=>{
  assert.match(new URL(configuredUrl).pathname,/[_-](test|isolated|ci)([_-]|$)/i,'test database URL must be explicitly isolated');
  const suffix=`${process.pid}_${randomBytes(5).toString('hex')}`;
  const base=new URL(configuredUrl);const baseName=base.pathname.replace(/^\//,'');
  const v1Url=new URL(configuredUrl),v2Url=new URL(configuredUrl);v1Url.pathname=`/${baseName}_${suffix}_v1`;v2Url.pathname=`/${baseName}_${suffix}_v2`;
  const v1mongoose=legacyRequire('mongoose');
  await v1mongoose.connect(v1Url.toString(),{serverSelectionTimeoutMS:1800,autoIndex:false,autoCreate:false}).catch(error=>{throw error;});
  const v2Connection=await mongoose.createConnection(v2Url.toString(),{serverSelectionTimeoutMS:1800,autoIndex:false,autoCreate:false}).asPromise().catch(async error=>{await v1mongoose.disconnect();throw error;});
  let runtime,server;
  const orgId=new mongoose.Types.ObjectId(),actorId=new mongoose.Types.ObjectId(),roleId=new mongoose.Types.ObjectId(),adminRoleId=new mongoose.Types.ObjectId();
  const identity={userId:String(actorId),_id:String(actorId),organizationId:String(orgId),activeOrganizationId:String(orgId),roleKey:'superadmin',activeRoleId:String(adminRoleId),roleIds:[String(adminRoleId)]};
  t.after(async()=>{try{await runtime?.close();if(server)await new Promise(resolve=>server.close(resolve));await v1mongoose.connection.dropDatabase();await v2Connection.dropDatabase();}finally{await v1mongoose.disconnect();await v2Connection.close();}});
  const V1={
    User:legacyRequire('./src/modules/users/user.model.js'),Organization:legacyRequire('./src/modules/organizations/organization.model.js'),
    OrgUser:legacyRequire('./src/modules/organizations/org-user.model.js'),Employee:legacyRequire('./src/modules/employees/employee.model.js'),
    Role:legacyRequire('./src/modules/roles/role.model.js'),Department:legacyRequire('./src/modules/departments/department.model.js'),
    Designation:legacyRequire('./src/modules/designations/designation.model.js'),OrgSettings:legacyRequire('./src/modules/orgSettings/orgSettings.model.js'),
    ApprovalFlow:legacyRequire('./src/modules/approvalFlows/approvalFlow.model.js'),Shift:legacyRequire('./src/modules/shifts/shift.model.js'),
    AuditLog:legacyRequire('./src/modules/auditLogs/auditLogs.model.js'),
  };
  await V1.Organization.create({_id:orgId,name:'Parity Organization',code:'PARITY',timezone:'Asia/Kolkata',currency:'INR'});
  await V1.User.create({_id:actorId,email:'parity-admin@example.test',password:'unused',status:'active',organizationIds:[orgId],activeOrganizationId:orgId});
  await V1.Role.create({_id:roleId,organizationId:orgId,name:'Employee',slug:'superadmin',isSystemRole:true,status:'active'});
  await V1.Role.create({_id:adminRoleId,organizationId:orgId,name:'Super Admin',slug:'superadmin',isSystemRole:true,status:'active'});
  await V1.OrgUser.create({userId:actorId,organizationId:orgId,roleIds:[adminRoleId]});
  await V1.OrgSettings.create({organizationId:orgId,employeeIdPrefix:'PX',probationPeriodDays:60,noticePeriodDays:30});
  const legacy=createLegacyRouterHarness({identity,overrides:{
    'src/middlewares/authorize.middleware.js':()=> (_req,_res,next)=>next(),
    'src/modules/users/user.model.js':V1.User,'src/modules/organizations/organization.model.js':V1.Organization,
    'src/modules/organizations/org-user.model.js':V1.OrgUser,'src/modules/employees/employee.model.js':V1.Employee,
    'src/modules/roles/role.model.js':V1.Role,'src/modules/departments/department.model.js':V1.Department,
    'src/modules/designations/designation.model.js':V1.Designation,'src/modules/orgSettings/orgSettings.model.js':V1.OrgSettings,
    'src/modules/approvalFlows/approvalFlow.model.js':V1.ApprovalFlow,'src/modules/shifts/shift.model.js':V1.Shift,
    'src/modules/auditLogs/auditLogs.model.js':V1.AuditLog,
    'src/modules/auditLogs/auditLogs.service.js':{audit:async()=>{}},
    'src/modules/organizations/organization.service.js':{isUserSuperAdmin:async()=>false,getOrganizationById:id=>V1.Organization.findById(id)},
    'src/modules/leaveBalances/leaveBalance.service.js':{initializeForEmployee:async()=>{}},
    'src/modules/notifications/notification.service.js':{createNotificationSafe:async()=>{}},
    'src/utils/sendMail.js':async()=>true,'src/config/cloudinary.js':{uploadDataUri:async()=>({secure_url:'https://assets.invalid/file'})},
    'src/config/payrollDb.js':{getPayrollPgPool:()=>null},
  },mounts:[
    {path:'/api/v1/employees',modulePath:'src/modules/employees/employee.routes.js'},
    {path:'/api/v1/designations',modulePath:'src/modules/designations/designation.routes.js'},
    {path:'/api/v1/departments',modulePath:'src/modules/departments/department.routes.js'},
  ]});
  server=createServer(legacy);await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
  const config=loadConfig({MONGODB_URI:v2Url.toString(),JWT_SECRET:`parity-${randomBytes(20).toString('hex')}`});
  const {signToken}=createTokens(config);
  let token=signToken({userId:String(actorId),organizationId:String(orgId),activeRoleId:String(adminRoleId)});
  runtime=await createRuntime({config,connection:v2Connection,logger:false});
  await runtime.organizationModels.Organization.create({_id:orgId,name:'Parity Organization',code:'PARITY',timezone:'Asia/Kolkata',currency:'INR'});
  await runtime.organizationModels.User.create({_id:actorId,email:'parity-admin@example.test',password:'unused',status:'active',organizationIds:[orgId],activeOrganizationId:orgId});
  await runtime.organizationModels.Role.create({_id:roleId,organizationId:orgId,name:'Employee',slug:'superadmin',isSystemRole:true,status:'active'});
  await runtime.organizationModels.Role.create({_id:adminRoleId,organizationId:orgId,name:'Super Admin',slug:'superadmin',isSystemRole:true,status:'active'});
  await runtime.organizationModels.Membership.create({userId:actorId,organizationId:orgId,roleIds:[adminRoleId]});
  await runtime.organizationModels.User.updateOne({_id:actorId},{$set:{tokenList:[{token,organizationId:orgId,status:'active'}]}});
  await runtime.orgSettingsModels.OrgSettings.create({organizationId:orgId,employeeIdPrefix:'PX',probationPeriodDays:60,noticePeriodDays:30});
  const v1origin=`http://127.0.0.1:${server.address().port}`;
  const call=async(method,pathV1,pathV2,payload,label,payloadV2=payload)=>{
    const headers=payload===undefined?{}:{'content-type':'application/json'};
    const a=await parseLegacy(await fetch(`${v1origin}${pathV1}`,{method,headers,...(payload===undefined?{}:{body:JSON.stringify(payload)})}));
    const b=parseV2(await runtime.app.inject({method,url:pathV2,headers:{authorization:`Bearer ${token}`},payload:payloadV2}));compare(a,b,label);return [a,b];
  };
  const createdDepartments=await call('POST','/api/v1/departments/','/api/v2/departments/',{name:'People Operations',code:'PEOPLE'},'department create');
  const v1Dept=createdDepartments[0].body.data._id,v2Dept=createdDepartments[1].body.data._id;
  await call('PUT',`/api/v1/departments/${v1Dept}`,`/api/v2/departments/${v2Dept}`,{name:'People Team',status:'active'},'department update');
  await call('GET',`/api/v1/departments/${v1Dept}`,`/api/v2/departments/${v2Dept}`,undefined,'department get');
  await call('GET','/api/v1/departments/','/api/v2/departments/',undefined,'department list');
  const designationPayload={name:'People Partner',level:2,departmentId:v1Dept};
  const designationCreated=await call('POST','/api/v1/designations/','/api/v2/designations/',designationPayload,'designation create',{...designationPayload,departmentId:v2Dept});
  const v1Des=designationCreated[0].body.data._id,v2Des=designationCreated[1].body.data._id;
  await call('PUT',`/api/v1/designations/${v1Des}`,`/api/v2/designations/${v2Des}`,{departmentId:v1Dept,status:'inactive'},'designation update',{departmentId:v2Dept,status:'inactive'});
  await call('GET','/api/v1/designations/?includeInactive=true','/api/v2/designations/?includeInactive=true',undefined,'designation list');
  await call('DELETE',`/api/v1/designations/${v1Des}`,`/api/v2/designations/${v2Des}`,undefined,'designation delete');
  await call('DELETE',`/api/v1/departments/${v1Dept}`,`/api/v2/departments/${v2Dept}`,undefined,'department delete');
  const engineeringId=new mongoose.Types.ObjectId();
  const activeDept=await Promise.all([
    V1.Department.create({_id:engineeringId,organizationId:orgId,name:'Engineering',code:'ENG'}),
    runtime.departmentModels.Department.create({_id:engineeringId,organizationId:orgId,name:'Engineering',code:'ENG'}),
  ]);
  const engineerDesignationId=new mongoose.Types.ObjectId();
  await Promise.all([V1.Designation.create({_id:engineerDesignationId,organizationId:orgId,name:'Engineer',departmentId:activeDept[0]._id,status:'active'}),runtime.designationModels.Designation.create({_id:engineerDesignationId,organizationId:orgId,name:'Engineer',departmentId:activeDept[1]._id,status:'active'})]);
  const employeePayload={email:`person-${suffix}@example.com`,roleIds:[String(roleId)],firstName:'jANE',lastName:'doe',employeeCode:`PX-${suffix}`,departmentId:String(activeDept[0]._id),designationId:String(engineerDesignationId),dateOfJoining:'2026-01-01T00:00:00.000Z',employmentType:'full_time'};
  const employeeCreated=await call('POST','/api/v1/employees/','/api/v2/employees/',employeePayload,'employee create');
  assert.equal(employeeCreated[0].status,201,JSON.stringify(employeeCreated[0].body));assert.equal(employeeCreated[1].status,201,JSON.stringify(employeeCreated[1].body));
  const e1=employeeCreated[0].body.data.employeeId,e2=employeeCreated[1].body.data.employeeId;
  const selfUserV1=employeeCreated[0].body.data.userId,selfUserV2=employeeCreated[1].body.data.userId;
  const lifecycleBeforeInvalid=await Promise.all([V1.Employee.findById(e1).lean(),runtime.employeeModels.Employee.findById(e2).lean()]);
  const invalidLifecycle=await call('PUT',`/api/v1/employees/${e1}/lifecycle-action`,`/api/v2/employees/${e2}/lifecycle-action`,{action:'unknown'},'employee invalid lifecycle action');
  assert.equal(invalidLifecycle[0].status,406,'unsupported lifecycle action is rejected by V1 validation');
  assert.deepEqual([await V1.Employee.findById(e1).lean(),await runtime.employeeModels.Employee.findById(e2).lean()],lifecycleBeforeInvalid,'invalid lifecycle action leaves both employee records unchanged');
  Object.assign(identity,{userId:selfUserV1,_id:selfUserV1,activeRoleId:String(roleId),roleIds:[String(roleId)]});
  token=signToken({userId:selfUserV2,organizationId:String(orgId),activeRoleId:String(roleId)});
  await Promise.all([V1.User.updateOne({_id:selfUserV1},{$set:{passwordChangeRequired:false}}),runtime.organizationModels.User.updateOne({_id:selfUserV2},{$set:{passwordChangeRequired:false,tokenList:[{token,organizationId:orgId,status:'active'}]}})]);
  await call('GET','/api/v1/employees/me','/api/v2/employees/me',undefined,'employee self profile');
  const profile={phone:'5551234567',dob:'1990-11-03T00:00:00.000Z',gender:'female',bloodGroup:'O+',panNumber:'abcde1234f',address:{line1:'1 Test Street',city:'Pune',state:'Maharashtra',country:'India',zip:'411001'},emergencyContacts:[{name:'Emergency Contact',relation:'sibling',phone:'5552223333'}]};
  await call('PUT','/api/v1/employees/me/profile','/api/v2/employees/me/profile',profile,'employee complete profile');
  await call('GET','/api/v1/employees/me','/api/v2/employees/me',undefined,'employee self profile after completion');
  await call('GET','/api/v1/employees/next-code','/api/v2/employees/next-code',undefined,'employee next code');
  await call('GET','/api/v1/employees/upcoming-events?days=5','/api/v2/employees/upcoming-events?days=5',undefined,'employee upcoming events');
  const csvA=await fetch(`${v1origin}/api/v1/employees/export?page=1&limit=20`);
  const csvB=await runtime.app.inject({method:'GET',url:'/api/v2/employees/export?page=1&limit=20',headers:{authorization:`Bearer ${token}`}});
  const csvHeaders=['content-type','content-disposition','cache-control'];
  assert.equal(csvA.status,csvB.statusCode,'employee export status');
  for(const header of csvHeaders)assert.equal(csvA.headers.get(header),csvB.headers[header],`employee export ${header}`);
  assert.equal(await csvA.text(),csvB.body,'employee export CSV body');
  await call('PUT','/api/v1/employees/bulk-update','/api/v2/employees/bulk-update',{employeeIds:[e1],status:'on_leave'},'employee bulk update',{employeeIds:[e2],status:'on_leave'});
  await call('PUT',`/api/v1/employees/${e1}/lifecycle-action`,`/api/v2/employees/${e2}/lifecycle-action`,{action:'confirm',confirmedDate:'2026-11-01'},'employee lifecycle action');
  await call('PUT',`/api/v1/employees/${e1}/lifecycle-action`,`/api/v2/employees/${e2}/lifecycle-action`,{action:'terminate_with_notice',reason:'Role transition',lastWorkingDay:'2026-12-15'},'employee notice termination');
  const [noticeV1,noticeV2]=await Promise.all([V1.Employee.findById(e1).lean(),runtime.employeeModels.Employee.findById(e2).lean()]);
  assert.deepEqual([noticeV1.status,noticeV1.employmentLifecycleStatus,Boolean(noticeV1.noticeStartDate),noticeV1.noticeEndDate?.toISOString(),noticeV1.lastWorkingDay?.toISOString(),noticeV1.benefitsEligible],[noticeV2.status,noticeV2.employmentLifecycleStatus,Boolean(noticeV2.noticeStartDate),noticeV2.noticeEndDate?.toISOString(),noticeV2.lastWorkingDay?.toISOString(),noticeV2.benefitsEligible],'notice termination lifecycle fields match');
  await call('PUT',`/api/v1/employees/${e1}/lifecycle-action`,`/api/v2/employees/${e2}/lifecycle-action`,{action:'terminate_without_notice',reason:'Immediate separation',lastWorkingDay:'2026-12-15'},'employee immediate termination');
  const [terminatedV1,terminatedV2]=await Promise.all([V1.Employee.findById(e1).lean(),runtime.employeeModels.Employee.findById(e2).lean()]);
  assert.deepEqual([terminatedV1.status,terminatedV1.employmentLifecycleStatus,terminatedV1.lastWorkingDay?.toISOString(),terminatedV1.benefitsEligible],[terminatedV2.status,terminatedV2.employmentLifecycleStatus,terminatedV2.lastWorkingDay?.toISOString(),terminatedV2.benefitsEligible],'immediate termination lifecycle fields match');
  await call('PUT',`/api/v1/employees/${e1}/reopen-profile`,`/api/v2/employees/${e2}/reopen-profile`,undefined,'employee reopen profile');
  await call('GET','/api/v1/employees/?page=1&limit=20','/api/v2/employees/?page=1&limit=20',undefined,'employee list');
  await call('GET',`/api/v1/employees/${e1}`,`/api/v2/employees/${e2}`,undefined,'employee get');
  await call('PUT',`/api/v1/employees/${e1}`,`/api/v2/employees/${e2}`,{firstName:'janet',lastName:'smith'},'employee update');
  await call('DELETE',`/api/v1/employees/${e1}`,`/api/v2/employees/${e2}`,undefined,'employee delete disabled');
  const employeeCounts=await Promise.all([V1.Employee.countDocuments({organizationId:orgId}),runtime.employeeModels.Employee.countDocuments({organizationId:orgId})]);
  assert.deepEqual(employeeCounts,[1,1],'both databases persist one created employee');
  const linkedCounts=await Promise.all([V1.User.countDocuments({email:employeePayload.email}),runtime.organizationModels.User.countDocuments({email:employeePayload.email})]);
  assert.deepEqual(linkedCounts,[1,1],'both databases persist the linked employee user');
  const membershipCounts=await Promise.all([V1.OrgUser.countDocuments({organizationId:orgId,roleIds:roleId}),runtime.organizationModels.Membership.countDocuments({organizationId:orgId,roleIds:roleId})]);
  assert.deepEqual(membershipCounts,[1,1],'both databases persist employee role membership');
  const [deptStatusV1,deptStatusV2]=await Promise.all([V1.Department.findById(v1Dept).lean(),runtime.departmentModels.Department.findById(v2Dept).lean()]);
  assert.deepEqual([deptStatusV1.status,deptStatusV1.isDeleted],[deptStatusV2.status,deptStatusV2.isDeleted],'department soft-delete state matches');
  const [designationStatusV1,designationStatusV2]=await Promise.all([V1.Designation.findById(v1Des).lean(),runtime.designationModels.Designation.findById(v2Des).lean()]);
  assert.deepEqual([designationStatusV1.status,designationStatusV1.isDeleted],[designationStatusV2.status,designationStatusV2.isDeleted],'designation soft-delete state matches');
  const [employeeV1,employeeV2]=await Promise.all([V1.Employee.findOne({userId:(await V1.User.findOne({email:employeePayload.email}))._id}),runtime.employeeModels.Employee.findOne({userId:(await runtime.organizationModels.User.findOne({email:employeePayload.email}))._id})]);
  assert.deepEqual([employeeV1.firstName,employeeV1.lastName,employeeV1.employeeCode],[employeeV2.firstName,employeeV2.lastName,employeeV2.employeeCode],'employee update persists normalized names and code identically');
});
