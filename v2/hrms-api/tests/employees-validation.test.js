import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createEmployeeSchema,completeProfileSchema,updateEmployeeSchema,lifecycleActionSchema,listEmployeesQuerySchema,bulkUpdateEmployeesSchema } from '../src/modules/employees/employee.validation.js';

const require=createRequire(import.meta.url);
const legacy=require('../../../hrms/back-end/src/modules/employees/employee.validation.js');
const ids=['0123456789abcdef01234567','1123456789abcdef01234567'];
const cases=[
  [legacy.createEmployeeByHrSchema,createEmployeeSchema,{email:' USER@example.com ',roleIds:[ids[0]],firstName:' Jane ',lastName:' Doe ',departmentId:ids[0],designationId:ids[1],dateOfJoining:'2026-01-01',employmentType:'full_time'}],
  [legacy.completeProfileSchema,completeProfileSchema,{phone:'9876543210',dob:'1990-01-01',gender:'female',address:{line1:'12 Main',city:'Pune',state:'Maharashtra',country:'India',zip:'411001'}}],
  [legacy.updateEmployeeSchema,updateEmployeeSchema,{email:' USER@example.com ',panNumber:'abcde1234f',status:'active',address:{city:'Pune'}}],
  [legacy.lifecycleActionSchema,lifecycleActionSchema,{action:'terminate_with_notice',reason:'Leaving'}],
  [legacy.listEmployeesQuerySchema,listEmployeesQuerySchema,{page:'2',limit:'25',search:' Jane ',sortOrder:'DESC',status:'active'}],
  [legacy.bulkUpdateEmployeesSchema,bulkUpdateEmployeesSchema,{employeeIds:[ids[0]],shiftId:''}],
];
for(const [legacySchema,v2Schema,payload] of cases)test(`employee validation matches V1: ${legacySchema._ids?.[0]?.key||'request'}`,()=>{
  const oldResult=legacySchema.validate(payload,{abortEarly:true});
  const newResult=v2Schema.validate(payload,{abortEarly:true});
  assert.equal(Boolean(newResult.error),Boolean(oldResult.error));
  assert.equal(newResult.error?.details[0]?.message,oldResult.error?.details[0]?.message);
  assert.deepEqual(JSON.parse(JSON.stringify(newResult.value)),JSON.parse(JSON.stringify(oldResult.value)));
});
