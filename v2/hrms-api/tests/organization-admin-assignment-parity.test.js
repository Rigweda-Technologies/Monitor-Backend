import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { createOrganizationService } from '../src/modules/organizations/organization.service.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const legacyRequire=createRequire(path.join(root,'hrms/back-end/package.json'));
const loadLegacyService=dependencies=>{
  const filename=path.join(root,'hrms/back-end/src/modules/organizations/organization.service.js');
  delete Module._cache[filename];
  const originalLoad=Module._load;
  Module._load=function(request,parent,isMain){
    if(parent?.filename===filename&&Object.hasOwn(dependencies,request))return dependencies[request];
    return originalLoad.call(this,request,parent,isMain);
  };
  try{return legacyRequire(filename);}finally{Module._load=originalLoad;}
};

const createFixture=()=>{
  const actorId=new mongoose.Types.ObjectId(),adminId=new mongoose.Types.ObjectId(),adminRoleId=new mongoose.Types.ObjectId();
  const state={organizations:[],memberships:[],employees:[],roles:[{_id:new mongoose.Types.ObjectId(),userId:actorId,slug:'superadmin'}],admin:{_id:adminId,email:'jordan.smith@example.test',organizationIds:[],activeOrganizationId:null,async save(){this.saved=true;}},initialized:[]};
  const query=value=>({select(){return this;},sort(){return this;},populate(){return this;},lean:async()=>value,then(resolve,reject){return Promise.resolve(value).then(resolve,reject);}});
  const models={
    Organization:{create:async body=>{const row={_id:new mongoose.Types.ObjectId(),...body};state.organizations.push(row);return row;}},
    User:{findById:async id=>String(id)===String(adminId)?state.admin:null},
    OrgUser:{
      find:filter=>query(state.roles.filter(row=>String(row.userId)===String(filter.userId)).map(row=>({roleIds:[{slug:row.slug}]}))),
      create:async row=>{state.memberships.push(row);return row;},
    },
    Role:{findOne:async filter=>state.seededRole&&String(filter.organizationId)===String(state.seededRole.organizationId)&&(filter.slug===state.seededRole.slug||String(filter._id)===String(state.seededRole._id))?state.seededRole:null},
    OrgSettings:{findOne:()=>query(null)},
    Employee:{
      find:()=>query([]),
      findOne:filter=>query(null),
      create:async body=>{const row={_id:new mongoose.Types.ObjectId(),...body};state.employees.push(row);return row;},
    },
  };
  const seed=async organizationId=>{state.seededRole={_id:adminRoleId,organizationId,slug:'org-admin'};};
  const initialize=async(employee,organizationId)=>state.initialized.push({employeeId:employee._id,organizationId});
  return {actorId,adminId,models,state,seed,initialize};
};

test('V1 and V2 organization creation with assigned admin preserves membership, employee and leave initialization',async()=>{
  const v1=createFixture(),v2=createFixture();
  const legacy=loadLegacyService({
    './organization.model':v1.models.Organization,'../users/user.model':v1.models.User,'./org-user.model':v1.models.OrgUser,
    '../roles/role.model':v1.models.Role,'../employees/employee.model':v1.models.Employee,'../orgSettings/orgSettings.model':v1.models.OrgSettings,
    '../leaveBalances/leaveBalance.service':{initializeForEmployee:v1.initialize},
    '../roles/role.seeder':{seedOrgRolesAndPermissions:v1.seed},
    '../../config/payrollDb':{getPayrollPgPool:async()=>null,isPayrollDbEnabled:()=>false},
  });
  const service=createOrganizationService({models:v2.models,seedOrganizationRoles:v2.seed,initializeLeaveBalance:v2.initialize,isSuperAdmin:async userId=>String(userId)===String(v2.actorId)});
  const input={name:'Assigned Admin Org',code:'ADMIN-PARITY',timezone:'Asia/Kolkata',currency:'INR',adminUserId:String(v1.adminId),creator:{userId:String(v1.actorId)}};
  const [resultV1,resultV2]=await Promise.all([
    legacy.createOrganization(input),
    service.create({body:{name:input.name,code:input.code,timezone:input.timezone,currency:input.currency,adminUserId:String(v2.adminId)},user:{userId:String(v2.actorId)}}),
  ]);
  const project=fixture=>{
    const organizationId=String(fixture.state.organizations[0]._id),adminId=String(fixture.adminId),roleId=String(fixture.state.seededRole._id),employeeId=String(fixture.state.employees[0]?._id||'');
    const stable=value=>String(value)===organizationId?'organization':String(value)===adminId?'admin':String(value)===roleId?'org-admin-role':String(value)===employeeId?'employee':'';
    return {
    organization:{name:fixture.state.organizations[0].name,code:fixture.state.organizations[0].code,timezone:fixture.state.organizations[0].timezone,currency:fixture.state.organizations[0].currency},
    admin:{organizationIds:fixture.state.admin.organizationIds.map(stable),activeOrganizationId:stable(fixture.state.admin.activeOrganizationId),saved:Boolean(fixture.state.admin.saved)},
    membership:fixture.state.memberships.map(row=>({userId:stable(row.userId),organizationId:stable(row.organizationId),roleId:stable(row.roleIds[0])})),
    employee:fixture.state.employees.map(({organizationId,userId,firstName,lastName,employeeCode,employmentType,status,employmentLifecycleStatus,profileCompleted,profileImage})=>({organizationId:stable(organizationId),userId:stable(userId),firstName,lastName,employeeCode,employmentType,status,employmentLifecycleStatus,profileCompleted,profileImage})),
    initialized:fixture.state.initialized.map(row=>({employeeId:stable(row.employeeId),organizationId:stable(row.organizationId)})),
  };};
  assert.deepEqual(resultV1.name,resultV2.name);
  assert.deepEqual(resultV1.code,resultV2.code);
  assert.deepEqual(project(v2),project(v1));
  assert.equal(project(v1).employee[0].employeeCode,'LV-0001');
  assert.equal(project(v2).employee[0].employeeCode,'LV-0001');
  assert.equal(v1.state.initialized.length,1);
  assert.equal(v2.state.initialized.length,1);
});
