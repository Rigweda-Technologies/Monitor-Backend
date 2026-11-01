import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createEmployeeModels } from '../src/modules/employees/employee.models.js';
import { createEmployeeService } from '../src/modules/employees/employee.service.js';

test('employee Mongoose model preserves the employees collection, legacy fields and scoped indexes',async t=>{
  const connection=mongoose.createConnection();t.after(()=>connection.close());
  const {Employee}=createEmployeeModels(connection);
  assert.equal(Employee.collection.collectionName,'employees');
  assert.equal(Employee.schema.options.autoIndex,false);
  assert.equal(Employee.schema.options.autoCreate,false);
  assert.ok(Employee.schema.path('probationEndDate'));
  assert.ok(Employee.schema.path('noticeEndDate'));
  assert.ok(Employee.schema.indexes().some(([keys,options])=>keys.organizationId===1&&keys.employeeCode===1&&options.unique));
});

test('employee creation scopes linked account records and delegates dependent effects',async()=>{
  const calls={};
  const user={_id:'user-1',email:'person@example.com'};
  const employee={_id:'employee-1'};
  const models={
    Employee:{findOne:async filter=>{calls.lastEmployeeFilter=filter;return null;},aggregate:async()=>[],create:async([payload])=>{calls.employee=payload;return [employee];}},
    User:{findOne:async filter=>{calls.userFilter=filter;return null;},create:async([payload])=>{calls.user=payload;return [user];}},
    OrgUser:{create:async([payload])=>{calls.membership=payload;return [payload];}},
    OrgSettings:{findOne:filter=>{calls.settingsFilter=filter;return {probationPeriodDays:60,noticePeriodDays:20,lean:async()=>({employeeIdPrefix:'RG',probationPeriodDays:60,noticePeriodDays:20})};}},
  };
  const service=createEmployeeService({models,env:{EMPLOYEE_ID_PREFIX:'RG'},integrations:{hashPassword:async value=>`hashed:${value}`,initializeLeaveBalance:async(...args)=>{calls.leaveArgs=args;},getOrganizationById:async()=>({name:'Example Org'}),sendOnboardingEmail:async value=>{calls.email=value;},audit:async value=>{calls.audit=value;}}});
  const result=await service.createByHr({user:{userId:'actor-1',organizationId:'org-1'},body:{email:' Person@Example.com ',roleIds:['role-1'],firstName:'jANE',lastName:'doe',departmentId:'dept-1',designationId:'des-1',dateOfJoining:'2026-01-01',employmentType:'full_time'}});
  assert.deepEqual(result,{employeeId:'employee-1',userId:'user-1',email:'person@example.com'});
  assert.equal(calls.user.email,'person@example.com');
  assert.match(calls.user.password,/^hashed:/);
  assert.deepEqual(calls.membership,{userId:'user-1',organizationId:'org-1',roleIds:['role-1']});
  assert.equal(calls.employee.organizationId,'org-1');
  assert.equal(calls.employee.employeeCode,'RG-0001');
  assert.equal(calls.employee.firstName,'Jane');
  assert.equal(calls.employee.probationPeriodDays,60);
  assert.equal(calls.employee.noticePeriodDays,20);
  assert.deepEqual(calls.settingsFilter,{organizationId:'org-1'});
  assert.equal(calls.leaveArgs[1],'org-1');
  assert.equal(calls.email.email,'person@example.com');
  assert.equal(calls.email.organizationName,'Example Org');
  assert.equal(calls.audit.organizationId,'org-1');
});

test('employee deletion remains disabled without touching repositories',async()=>{
  const service=createEmployeeService({models:{},integrations:{}});
  await assert.rejects(()=>service.remove(),error=>error.statusCode===405&&/deletion is disabled/.test(error.message));
});

test('employee details cannot cross the authenticated organization boundary',async()=>{
  let filter;
  const query={setOptions(){return this;},populate(){return this;},then(resolve,reject){return Promise.resolve(null).then(resolve,reject);}};
  const service=createEmployeeService({models:{Employee:{findOne:value=>{filter=value;return query;}}},integrations:{}});
  await assert.rejects(()=>service.getById({params:{id:'employee-foreign'},user:{userId:'viewer-1',organizationId:'org-1'}}),error=>error.statusCode===404);
  assert.deepEqual(filter,{_id:'employee-foreign',organizationId:'org-1'});
});

test('upcoming birthdays apply the V1 February 29 rule and authenticated organization filter',async()=>{
  let filter;
  const rows=[{_id:'emp-1',firstName:'Leap',lastName:'Person',employeeCode:'RG-1',dob:new Date('2000-02-29T12:00:00'),dateOfJoining:null}];
  const query={select(){return this;},then(resolve,reject){return Promise.resolve(rows).then(resolve,reject);}};
  const service=createEmployeeService({models:{Employee:{find:value=>{filter=value;return query;}}},integrations:{},now:()=>new Date('2025-02-27T09:00:00')});
  const data=await service.upcomingEvents({query:{days:'2'},user:{userId:'viewer-1',organizationId:'org-1'}});
  assert.equal(filter.organizationId,'org-1');
  assert.equal(data.windowDays,2);
  assert.equal(data.birthdays[0].eventDate.getDate(),28);
  assert.equal(data.birthdays[0].daysAway,1);
});
