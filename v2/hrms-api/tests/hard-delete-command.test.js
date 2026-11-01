import test from 'node:test';
import assert from 'node:assert/strict';
import { createHardDeleteCommand, buildHardDeleteSummary } from '../src/modules/organizations/hard-delete-command.js';
import { createOrganizationPayrollRepository } from '../src/modules/organizations/organization-payroll.repository.js';

const fixture=()=>{
  const organizationId='507f1f77bcf86cd799439011';
  const calls=[];
  const models={
    Organization:{findById:id=>({select:()=>({lean:async()=>String(id)===organizationId?{name:'Acme',code:'ACME',status:'inactive',isSoftDeleted:true}:null})})},
    User:{find:()=>({lean:async()=>[
      {_id:'sole-user',organizationIds:[organizationId]},
      {_id:'shared-user',organizationIds:[organizationId,'507f1f77bcf86cd799439012']},
    ]})},
    Membership:{countDocuments:async filter=>filter.organizationId===organizationId?2:0},
    scopedModels:{
      users:{modelName:'users',schema:{path:()=>({})},collection:{name:'users'},countDocuments:async()=>10},
      Department:{modelName:'Department',schema:{path:key=>key==='organizationId'?{}:null},collection:{name:'departments'},countDocuments:async()=>3},
      Employee:{modelName:'Employee',schema:{path:key=>key==='organizationId'?{}:null},collection:{name:'employees'},countDocuments:async()=>0},
    },
  };
  const payrollRepository={countTenantsForOrganization:async id=>id===organizationId?1:0};
  const command=createHardDeleteCommand({models,payrollRepository,hardDelete:async input=>{calls.push(input);return{organizationDeleted:true};}});
  return{organizationId,calls,command,models,payrollRepository};
};

test('hard-delete summary counts scoped collections, sole/shared accounts, memberships and payroll',async()=>{
  const {organizationId,models,payrollRepository}=fixture();
  assert.deepEqual(await buildHardDeleteSummary({models,payrollRepository,organizationId}),{
    organization:{name:'Acme',code:'ACME',status:'inactive',isSoftDeleted:true},
    collectionCounts:[{modelName:'Department',collectionName:'departments',count:3}],
    linkedUsers:2,orphanUsers:1,multiOrgUsers:1,membershipCount:2,payrollTenantCount:1,
  });
});

test('hard-delete command dry run reports impact without invoking deletion',async()=>{
  const {organizationId,calls,command}=fixture();
  const result=await command({organizationId});
  assert.equal(result.mode,'dry-run');
  assert.equal(result.beforeSummary.orphanUsers,1);
  assert.deepEqual(calls,[]);
});

test('hard-delete command delegates confirmed execution and includes pre-delete summary',async()=>{
  const {organizationId,calls,command}=fixture();
  const result=await command({organizationId,actorUserId:'507f1f77bcf86cd799439099',confirmationCode:'ACME',execute:true});
  assert.equal(result.mode,'executed');
  assert.equal(result.result.organizationDeleted,true);
  assert.equal(result.beforeSummary.membershipCount,2);
  assert.equal(result.confirmationCode,'ACME');
  assert.deepEqual(calls,[{organizationId,action:'hard_delete',actorUserId:'507f1f77bcf86cd799439099',confirmationCode:'ACME'}]);
});

test('hard-delete summary rejects missing organizations',async()=>{
  const {models,payrollRepository}=fixture();
  await assert.rejects(buildHardDeleteSummary({models,payrollRepository,organizationId:'missing'}),/Organization not found/);
});

test('organization payroll repository counts tenants with a bound organization parameter',async()=>{
  const calls=[];
  const prisma={$queryRawUnsafe:async(...args)=>{calls.push(args);return[{count:2}];}};
  const repository=createOrganizationPayrollRepository({prisma,enabled:true});
  assert.equal(await repository.countTenantsForOrganization('507f1f77bcf86cd799439011'),2);
  assert.deepEqual(calls,[[
    'SELECT COUNT(*)::int AS count FROM payroll_tenants WHERE organization_id = $1',
    '507f1f77bcf86cd799439011',
  ]]);
  assert.equal(await createOrganizationPayrollRepository({enabled:false}).countTenantsForOrganization('org'),0);
});
