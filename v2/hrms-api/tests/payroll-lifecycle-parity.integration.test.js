import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { applyV1PayrollMigrations } from './helpers/apply-v1-payroll-migrations.js';
import { connectPrismaClients } from '../src/database/prisma.js';
import { loadConfig } from '../src/config/env.js';
import { createPayrollRepository } from '../src/modules/payroll/payroll.repository.js';
import { createPayrollService } from '../src/modules/payroll/payroll.service.js';
import { registerPayrollRoutes } from '../src/modules/payroll/payroll.routes.js';
import { errorHandler } from '../src/plugins/errors.js';

const databaseUrl = process.env.V2_HRMS_ISOLATED_PAYROLL_TEST_DATABASE_URL;
const require = createRequire(import.meta.url);
const { Client } = require('../../../desktop/backend/node_modules/pg');
const identityOrganization = `payroll-parity-${randomUUID()}`;
const actorId = `payroll-test-${randomUUID()}`;
const actorRoleId = `payroll-role-${randomUUID()}`;
const employeeExternalId = randomUUID().replaceAll('-', '').slice(0, 24);
const orgSettings = { payrollEnabled:true, payrollCutoffDay:25, payrollSalaryPayDay:30, timezone:'Asia/Kolkata', attendanceLockMode:'payroll_cutoff', attendanceLockAfterDays:7, salaryProrationRule:'payable_days' };
const organization = { _id:identityOrganization, name:'Payroll Parity Org', code:'PAYPARITY', timezone:'Asia/Kolkata' };
const employee = { _id:employeeExternalId, confirmedDate:null, dateOfJoining:new Date('2020-01-01T00:00:00.000Z'), employmentLifecycleStatus:'confirmed', isDeleted:false, status:'active' };
const payrollEmployee = { _id:employeeExternalId, organizationId:identityOrganization, userId:actorId, employeeCode:'P-001', firstName:'Parity', lastName:'Employee', dateOfJoining:new Date('2020-01-01T00:00:00.000Z'), departmentId:null, designationId:null, address:null, panNumber:null };

const deriveDatabaseUrl = suffix => {
  const target = new URL(databaseUrl);
  target.pathname = `/${suffix}`;
  return target.toString();
};

const createDatabase = async url => {
  const name=new URL(url).pathname.slice(1);
  const admin=new Client({connectionString:databaseUrl});
  await admin.connect();
  try { await admin.query(`CREATE DATABASE "${name.replaceAll('"','""')}"`); }
  finally { await admin.end(); }
};
const dropDatabase = async url => {
  const name=new URL(url).pathname.slice(1);
  const admin=new Client({connectionString:databaseUrl});
  await admin.connect();
  try { await admin.query(`DROP DATABASE IF EXISTS "${name.replaceAll('"','""')}" WITH (FORCE)`); }
  finally { await admin.end(); }
};

const makeConfig = url => loadConfig({
  MONGODB_URI:'mongodb://127.0.0.1:27017/hrms_v2_isolated_test',
  JWT_SECRET:'payroll-lifecycle-parity-test-secret-0123456789',
  PAYROLL_DB_ENABLED:'true',
  PAYROLL_DATABASE_URL:url,
  PAYROLL_IDEMPOTENCY_REQUIRED:'false',
  PAYROLL_COMPUTE_ASYNC_DEFAULT:'false',
  PAYROLL_DEFAULT_TIMEZONE:'Asia/Kolkata',
});

const normalize = value => {
  const generated = new Map(); let sequence = 0;
  const timestampKeys = new Set(['created_at','updated_at','createdAt','updatedAt','generated_at','computed_at','started_at','completed_at','submitted_at','lastSubmittedAt','approved_at','locked_at','paid_at','last_seen_at']);
  const walk = (item,key='') => {
    if (timestampKeys.has(key)) return undefined;
    if (typeof item === 'string' && /^[a-f\d]{8}-[a-f\d]{4}-[1-5][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(item)) {
      if (!generated.has(item)) generated.set(item,`generated-${++sequence}`);
      return generated.get(item);
    }
    if (Array.isArray(item)) return item.map(child=>walk(child));
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).filter(([k])=>!timestampKeys.has(k)).map(([k,v])=>[k,walk(v,k)]));
    return item;
  };
  return walk(value);
};

const makePrismaClients = async url => {
  const clients = await connectPrismaClients(makeConfig(url).postgres);
  return clients;
};

const makePrismaBackedPool = prisma => ({
  async connect() {
    let transactionClient; let finishTransaction; let readyTransaction;
    let savepointDepth=0; let released=false;
    const ready = new Promise(resolve=>{readyTransaction=resolve;});
    const finished = new Promise(resolve=>{finishTransaction=resolve;});
    const pending = prisma.$transaction(async tx=>{ transactionClient=tx; readyTransaction(); await finished; },{maxWait:10000,timeout:120000});
    await ready;
    pending.catch(()=>{});
    const execute = async (statement,values=[]) => {
      const result = await transactionClient.$executeRawUnsafe(statement,...values);
      return { rows:[], rowCount:Number(result)||0 };
    };
    const query = async (statement,values=[]) => {
      const normalized=String(statement).trim().toUpperCase();
      if (normalized==='BEGIN' || normalized.startsWith('BEGIN ')) {
        savepointDepth+=1;
        await transactionClient.$executeRawUnsafe(`SAVEPOINT legacy_route_${savepointDepth}`);
        return {rows:[],rowCount:0};
      }
      if (normalized==='COMMIT' || normalized==='END') {
        if (savepointDepth>0) await transactionClient.$executeRawUnsafe(`RELEASE SAVEPOINT legacy_route_${savepointDepth--}`);
        return {rows:[],rowCount:0};
      }
      if (normalized==='ROLLBACK') {
        if (savepointDepth>0) {
          await transactionClient.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT legacy_route_${savepointDepth}`);
          await transactionClient.$executeRawUnsafe(`RELEASE SAVEPOINT legacy_route_${savepointDepth--}`);
        }
        return {rows:[],rowCount:0};
      }
      if (/^(SELECT|WITH|SHOW|EXPLAIN)\b/.test(normalized) || /\bRETURNING\b/.test(normalized)) {
        const rows=await transactionClient.$queryRawUnsafe(statement,...values);
        const pgValue=row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,typeof value==='bigint'?value.toString():value]));
        return {rows:rows.map(pgValue),rowCount:rows.length};
      }
      return execute(statement,values);
    };
    return {
      query,
      release() {
        if (released) return;
        released=true;
        finishTransaction();
        return pending;
      },
    };
  },
});

const modelQuery = value => ({ select(){return this;}, lean:async()=>value });
const emptyCollectionModel = { find:()=>({select(){return this;},lean:async()=>[]}) };
const models = {
  OrgSettings:{ findOne:()=>modelQuery({...orgSettings,logoUrl:null}) },
  Organization:{ findById:()=>modelQuery(organization) },
  Role:{ findOne:()=>modelQuery({slug:'admin'}) },
  Attendance:emptyCollectionModel,
  Leave:emptyCollectionModel,
  LeaveType:emptyCollectionModel,
  Holiday:emptyCollectionModel,
  WeekOff:emptyCollectionModel,
  Employee:{
    find:()=>({select(){return this;},sort(){return this;},lean:async()=>[structuredClone(payrollEmployee)]}),
    findOne:()=>({select(){return this;},populate(){return this;},sort(){return this;},lean:async()=>structuredClone(payrollEmployee)}),
  },
};

test('V1/V2 payroll provisioning failure contracts match and payroll run compute matches on isolated PostgreSQL', { skip: !databaseUrl }, async t => {
  const base=new URL(databaseUrl);
  assert.match(base.pathname,/[_-](test|isolated|ci)([_-]|$)/i,'payroll test DB must be explicitly isolated');
  assert.ok(['localhost','127.0.0.1','::1'].includes(base.hostname),'payroll test DB must be local');
  const suffix=`${process.pid}_${randomUUID().replaceAll('-','').slice(0,12)}`;
  const v2Url=deriveDatabaseUrl(`hrms_v2_isolated_lifecycle_v2_${suffix}`);
  const legacyUrl=deriveDatabaseUrl(`hrms_v2_isolated_lifecycle_v1_${suffix}`);
  for (const url of [v2Url,legacyUrl]) {
    const parsed=new URL(url);
    assert.match(parsed.pathname,/[_-](test|isolated|ci)([_-]|$)/i,'both payroll DBs must remain explicitly isolated');
    assert.ok(['localhost','127.0.0.1','::1'].includes(parsed.hostname),'both payroll DBs must be local');
  }

  await createDatabase(v2Url);
  try { await createDatabase(legacyUrl); }
  catch (error) { await dropDatabase(v2Url); throw error; }
  const v2Clients=await makePrismaClients(v2Url);
  const v1Clients=await makePrismaClients(legacyUrl);
  let v1Server; let v2; let v2Origin;
  t.after(async()=>{
    await v2?.close().catch(()=>{});
    if (v1Server) await new Promise(resolve=>v1Server.close(resolve));
    const deleteTenant=async prisma=>prisma.$executeRawUnsafe('DELETE FROM payroll_tenants WHERE organization_id = $1',identityOrganization).catch(()=>0);
    await Promise.all([deleteTenant(v1Clients.payroll),deleteTenant(v2Clients.payroll)]);
    await Promise.all([v1Clients.close(),v2Clients.close()]);
    await Promise.all([dropDatabase(legacyUrl).catch(()=>{}),dropDatabase(v2Url).catch(()=>{})]);
  });
  const v2Migrations=await applyV1PayrollMigrations(v2Clients.payroll);
  const v1Migrations=await applyV1PayrollMigrations(v1Clients.payroll);
  const v1Pool=makePrismaBackedPool(v1Clients.payroll);
  const v2Repository=createPayrollRepository({prisma:v2Clients.payroll});
  const v2Service=createPayrollService({repository:v2Repository,models,config:makeConfig(v2Url)});
  const v1App=createLegacyRouterHarness({
    mounts:[{path:'/api/v1/payroll',modulePath:'src/modules/payroll/payrollAttendance.routes.js'}],
    identity:{userId:actorId,organizationId:identityOrganization,activeRoleId:actorRoleId},
    environment:{PAYROLL_IDEMPOTENCY_REQUIRED:'false',PAYROLL_COMPUTE_ASYNC_DEFAULT:'false'},
    overrides:{
      'src/config/payrollDb.js':{getPayrollPgPool:async()=>v1Pool},
      'src/modules/payroll/payrollSchema.service.js':{ensurePayrollSchema:async()=>{}},
      'src/modules/orgSettings/orgSettings.model.js':models.OrgSettings,
      'src/modules/organizations/organization.model.js':models.Organization,
      'src/modules/roles/role.model.js':models.Role,
      'src/modules/employees/employee.model.js':models.Employee,
      'src/modules/timesheets/timesheetAttendance.model.js':models.Attendance,
      'src/modules/leaves/leave.model.js':models.Leave,
      'src/modules/leaveTypes/leaveType.model.js':models.LeaveType,
      'src/modules/holidays/holiday.model.js':models.Holiday,
      'src/modules/weekOffs/weekOff.model.js':models.WeekOff,
    },
  });
  v1Server=v1App.listen(0,'127.0.0.1');
  await new Promise(resolve=>v1Server.once('listening',resolve));
  v2=Fastify({logger:false});
  v2.setErrorHandler(errorHandler);
  await registerPayrollRoutes(v2,{
    service:v2Service,
    authenticate:async request=>{request.user={userId:actorId,organizationId:identityOrganization,activeRoleId:actorRoleId};},
    authorize:async()=>null,
    idempotencyRequired:false,
  });
  await v2.ready();
  v2Origin=await v2.listen({port:0,host:'127.0.0.1'});

  const request=async(origin,method,route,body,headers={})=>{
    const response=await fetch(`${origin}${route}`,{method,headers:{...(body===undefined?{}:{'content-type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:response.status,body:await response.json()};
  };
  const comparePaths=async(method,v1Route,v2Route,v1Body,v2Body=v1Body,headers={})=>{
    const [left,right]=await Promise.all([
      request(`http://127.0.0.1:${v1Server.address().port}`,method,`/api/v1/payroll${v1Route}`,v1Body,headers),
      request(v2Origin,method,`/api/v2/payroll${v2Route}`,v2Body,headers),
    ]);
    assert.equal(right.status,left.status,`${method} ${v1Route} HTTP status`);
    assert.deepEqual(normalize(right.body),normalize(left.body),`${method} ${v1Route} response body`);
    return {v1:left.body,v2:right.body};
  };
  const comparePayslip=async(v1Route,v2Route)=>{
    const [left,right]=await Promise.all([
      request(`http://127.0.0.1:${v1Server.address().port}`,'GET',`/api/v1/payroll${v1Route}`),
      request(v2Origin,'GET',`/api/v2/payroll${v2Route}`),
    ]);
    assert.equal(right.status,left.status,`GET ${v1Route} HTTP status; V1=${JSON.stringify(left.body)} V2=${JSON.stringify(right.body)}`);
    const normalizePayslip=value=>{
      const copy=structuredClone(value);
      const payload=copy?.data;
      if(payload?.pdfPayload?.documentMeta)payload.pdfPayload.documentMeta.generatedAt='<generated-at>';
      return normalize(copy);
    };
    assert.deepEqual(normalizePayslip(right.body),normalizePayslip(left.body),`GET ${v1Route} response body`);
    return {v1:left.body,v2:right.body};
  };
  const compareSelfResponse=async(v1Route,v2Route)=>{
    const [left,right]=await Promise.all([
      request(`http://127.0.0.1:${v1Server.address().port}`,'GET',`/api/v1/payroll${v1Route}`),
      request(v2Origin,'GET',`/api/v2/payroll${v2Route}`),
    ]);
    assert.equal(right.status,left.status,`GET ${v1Route} HTTP status`);
    const normalizePayslip=value=>{
      const copy=structuredClone(value);
      if(copy?.data?.pdfPayload?.documentMeta)copy.data.pdfPayload.documentMeta.generatedAt='<generated-at>';
      return normalize(copy);
    };
    assert.deepEqual(normalizePayslip(right.body),normalizePayslip(left.body),`GET ${v1Route} response body`);
    return {v1:left.body,v2:right.body};
  };
  const compare=(method,route,v1Body,v2Body=v1Body,headers={})=>comparePaths(method,route,route,v1Body,v2Body,headers);

  const payGroupInput={code:'PARITY-GROUP',name:'Parity Group',description:'Integration parity pay group',payFrequency:'monthly',cutoffDay:25,salaryPayDay:30,workWeekDays:5,isActive:true};
  const v1Provisioning=await request(`http://127.0.0.1:${v1Server.address().port}`,'POST','/api/v1/payroll/pay-groups',payGroupInput);
  const v2Provisioning=await request(v2Origin,'POST','/api/v2/payroll/pay-groups',payGroupInput);
  assert.equal(v1Provisioning.status,500,'V1 starter provisioning currently fails on the expression index created by migration 0010');
  assert.match(v1Provisioning.body.message,/42P10/);
  assert.equal(v2Provisioning.status,v1Provisioning.status,'V2 preserves the selected V1 500 behavior on the current V1-migrated schema');
  assert.deepEqual(v2Provisioning.body,v1Provisioning.body,'V2 preserves the V1 payroll provisioning failure envelope and message');
  assert.match(v2Provisioning.body.message,/42P10/);
  assert.ok(['applied-current','already-current'].includes(v1Migrations));
  assert.ok(['applied-current','already-current'].includes(v2Migrations));
  let [v1TenantRows,v2TenantRows]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT id,organization_id,legal_name,state_code,timezone,currency_code,is_active FROM payroll_tenants WHERE organization_id = $1',identityOrganization),
    v2Clients.payroll.$queryRawUnsafe('SELECT id,organization_id,legal_name,state_code,timezone,currency_code,is_active FROM payroll_tenants WHERE organization_id = $1',identityOrganization),
  ]);
  assert.equal(v1TenantRows.length,0,'failed V1 provisioning rolls back the tenant insert');
  assert.equal(v2TenantRows.length,0,'failed V2 provisioning rolls back the tenant insert');

  // The current V1 migration's expression indexes cause V1's ON CONFLICT target
  // to fail. On the legacy-compatible schema shape both implementations should
  // still be able to provision equivalent fixtures for the run-compute parity below.
  const restoreLegacyComponentIndexes=async prisma=>{
    for(const [table,version,effective,overlap] of [
      ['earning_components','uq_earning_component_version','uq_earning_component_effective_start','ex_earning_component_no_overlap'],
      ['deduction_components','uq_deduction_component_version','uq_deduction_component_effective_start','ex_deduction_component_no_overlap'],
      ['employer_contribution_components','uq_employer_component_version','uq_employer_component_effective_start','ex_employer_component_no_overlap'],
    ]){
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${overlap}`);
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS ${version}`);
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS ${effective}`);
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD CONSTRAINT ${version} UNIQUE (tenant_id,code,version_no)`);
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD CONSTRAINT ${effective} UNIQUE (tenant_id,code,effective_from)`);
    }
  };
  await Promise.all([restoreLegacyComponentIndexes(v1Clients.payroll),restoreLegacyComponentIndexes(v2Clients.payroll)]);
  const [v1CompatibleProvisioning,v2CompatibleProvisioning]=await Promise.all([
    request(`http://127.0.0.1:${v1Server.address().port}`,'POST','/api/v1/payroll/pay-groups',payGroupInput),
    request(v2Origin,'POST','/api/v2/payroll/pay-groups',payGroupInput),
  ]);
  assert.equal(v1CompatibleProvisioning.status,201);
  assert.equal(v2CompatibleProvisioning.status,201);
  assert.equal(v1CompatibleProvisioning.body.message,'Pay group created successfully');
  assert.equal(v2CompatibleProvisioning.body.message,v1CompatibleProvisioning.body.message);
  const groups={v1:v1CompatibleProvisioning.body,v2:v2CompatibleProvisioning.body};
  [v1TenantRows,v2TenantRows]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT id,organization_id,legal_name,state_code,timezone,currency_code,is_active FROM payroll_tenants WHERE organization_id = $1',identityOrganization),
    v2Clients.payroll.$queryRawUnsafe('SELECT id,organization_id,legal_name,state_code,timezone,currency_code,is_active FROM payroll_tenants WHERE organization_id = $1',identityOrganization),
  ]);
  assert.equal(v1TenantRows.length,1);assert.equal(v2TenantRows.length,1);
  assert.deepEqual(normalize(v2TenantRows[0]),normalize(v1TenantRows[0]));
  const [v1Defaults,v2Defaults]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT code,name,pay_frequency,cutoff_day,salary_pay_day FROM pay_groups WHERE tenant_id = $1 ORDER BY code',v1TenantRows[0].id),
    v2Clients.payroll.$queryRawUnsafe('SELECT code,name,pay_frequency,cutoff_day,salary_pay_day FROM pay_groups WHERE tenant_id = $1 ORDER BY code',v2TenantRows[0].id),
  ]);
  assert.deepEqual(v2Defaults,v1Defaults);

  const v1PayGroupId=groups.v1.data.id; const v2PayGroupId=groups.v2.data.id;
  await compare('GET','/pay-groups');
  await comparePaths('GET',`/pay-groups/${v1PayGroupId}`,`/pay-groups/${v2PayGroupId}`);
  await comparePaths('PUT',`/pay-groups/${v1PayGroupId}`,`/pay-groups/${v2PayGroupId}`,{name:'Parity Group Updated',salaryPayDay:28});
  const [v1UpdatedGroup,v2UpdatedGroup]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT code,name,pay_frequency,cutoff_day,salary_pay_day,work_week_days,is_active,metadata FROM pay_groups WHERE id=$1',v1PayGroupId),
    v2Clients.payroll.$queryRawUnsafe('SELECT code,name,pay_frequency,cutoff_day,salary_pay_day,work_week_days,is_active,metadata FROM pay_groups WHERE id=$1',v2PayGroupId),
  ]);
  assert.deepEqual(v2UpdatedGroup,v1UpdatedGroup,'pay-group updates persist matching fields');
  const componentInput={scope:'earning',code:'PARITY-EARNING',name:'Parity Earning',displayName:'Parity Earning',description:'Salary component lifecycle parity',calculationMode:'fixed',taxable:true,priority:20,pfApplicable:false,esiApplicable:false,prorateWithAttendance:true,effectiveFrom:'2026-10-01T00:00:00.000Z',metadata:{source:'payroll-parity'}};
  const componentCreated=await compare('POST','/salary-components',componentInput);
  const v1ComponentId=componentCreated.v1.data.id;const v2ComponentId=componentCreated.v2.data.id;
  const componentListPath='/salary-components?scope=earning&payGroupId=';
  await comparePaths('GET',`${componentListPath}${v1PayGroupId}`,`${componentListPath}${v2PayGroupId}`);
  await comparePaths('GET',`/salary-components/${v1ComponentId}?scope=earning`,`/salary-components/${v2ComponentId}?scope=earning`);
  await comparePaths('PUT',`/salary-components/${v1ComponentId}?scope=earning&preserveTimeline=true`,`/salary-components/${v2ComponentId}?scope=earning&preserveTimeline=true`,{name:'Parity Earning Revised',description:'Updated component description',priority:25,metadata:{updated:true}});
  await comparePaths('GET',`/salary-components/${v1ComponentId}?scope=earning`,`/salary-components/${v2ComponentId}?scope=earning`);
  const [v1ComponentState,v2ComponentState]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT code,name,display_name,description,calculation_mode,taxable,priority,pf_applicable,esi_applicable,prorate_with_attendance,effective_from,effective_to,version_no,is_active,metadata FROM earning_components WHERE id=$1',v1ComponentId),
    v2Clients.payroll.$queryRawUnsafe('SELECT code,name,display_name,description,calculation_mode,taxable,priority,pf_applicable,esi_applicable,prorate_with_attendance,effective_from,effective_to,version_no,is_active,metadata FROM earning_components WHERE id=$1',v2ComponentId),
  ]);
  assert.deepEqual(normalize(v2ComponentState),normalize(v1ComponentState),'salary component update persists matching fields');
  await comparePaths('DELETE',`/salary-components/${v1ComponentId}?scope=earning`,`/salary-components/${v2ComponentId}?scope=earning`);
  const [v1ArchivedComponent,v2ArchivedComponent]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT is_active,effective_to FROM earning_components WHERE id=$1',v1ComponentId),
    v2Clients.payroll.$queryRawUnsafe('SELECT is_active,effective_to FROM earning_components WHERE id=$1',v2ComponentId),
  ]);
  assert.deepEqual(normalize(v2ArchivedComponent),normalize(v1ArchivedComponent),'salary component archive state matches');
  const profileInput={employeeExternalId:'507f1f77bcf86cd799439021',employeeCode:'P-PROFILE-1',payGroupId:v1PayGroupId,payrollStatus:'active',taxRegime:'new',dateOfJoining:'2024-03-01',costCenterCode:'ENG',metadata:{source:'parity-create'}};
  const createdProfile=await comparePaths('POST','/employee-profiles','/employee-profiles',profileInput,{...profileInput,payGroupId:v2PayGroupId});
  const v1ProfileId=createdProfile.v1.data.id;const v2ProfileId=createdProfile.v2.data.id;
  assert.ok(v1ProfileId&&v2ProfileId,'both APIs return created profile IDs');
  const upsertProfile=await comparePaths('POST','/employee-profiles','/employee-profiles',{...profileInput,employeeCode:'P-PROFILE-1B',metadata:{upserted:true}},{...profileInput,payGroupId:v2PayGroupId,employeeCode:'P-PROFILE-1B',metadata:{upserted:true}});
  assert.equal(upsertProfile.v1.data.id,v1ProfileId,'V1 profile upsert retains the profile ID');
  assert.equal(upsertProfile.v2.data.id,v2ProfileId,'V2 profile upsert retains the profile ID');
  await comparePaths('GET',`/employee-profiles/${v1ProfileId}`,`/employee-profiles/${v2ProfileId}`);
  await comparePaths('PUT',`/employee-profiles/${v1ProfileId}`,`/employee-profiles/${v2ProfileId}`,{payrollStatus:'on_hold',locationCode:'Pune',metadata:{updated:true}});
  const [v1ProfileState,v2ProfileState]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT employee_external_id,employee_code,pay_group_id,payroll_status,tax_regime,cost_center_code,location_code,metadata FROM employee_payroll_profiles WHERE id=$1',v1ProfileId),
    v2Clients.payroll.$queryRawUnsafe('SELECT employee_external_id,employee_code,pay_group_id,payroll_status,tax_regime,cost_center_code,location_code,metadata FROM employee_payroll_profiles WHERE id=$1',v2ProfileId),
  ]);
  assert.deepEqual(normalize(v2ProfileState),normalize(v1ProfileState),'profile create/upsert/update persist the same fields');
  const bankPathV1=`/employee-profiles/${v1ProfileId}/bank-details`;const bankPathV2=`/employee-profiles/${v2ProfileId}/bank-details`;
  const bankInput={accountHolderName:'Parity Employee',bankName:'Example Bank',branchName:'Pune',accountNumber:'123456789012',ifscCode:'HDFC0000123',accountType:'salary',paymentMode:'bank_transfer',isPrimary:true,effectiveFrom:'2026-10-01T00:00:00.000Z',metadata:{source:'payroll-parity'}};
  await comparePaths('POST',bankPathV1,bankPathV2,bankInput);
  await comparePaths('POST',bankPathV1,bankPathV2,{...bankInput,branchName:'Updated Pune Branch',isVerified:true});
  const statutoryPathV1=`/employee-profiles/${v1ProfileId}/statutory-details`;const statutoryPathV2=`/employee-profiles/${v2ProfileId}/statutory-details`;
  await comparePaths('POST',statutoryPathV1,statutoryPathV2,{pan:'ABCDE1234F',aadhaar:'123456789012',uan:'123456789012',esicNumber:'ESIC-1',taxRegime:'new',effectiveFrom:'2026-10-01T00:00:00.000Z',metadata:{source:'payroll-parity'}});
  const salaryPathV1=`/employee-profiles/${v1ProfileId}/salary-structures`;const salaryPathV2=`/employee-profiles/${v2ProfileId}/salary-structures`;
  const salaryCreated=await comparePaths('POST',salaryPathV1,salaryPathV2,{structureCode:'PARITY-SALARY-2',structureName:'Parity Salary Structure',annualCtc:720000,monthlyGross:60000,basicPay:24000,variablePay:0,effectiveFrom:'2026-10-01T00:00:00.000Z',metadata:{source:'payroll-parity'}});
  const salaryIdV1=salaryCreated.v1.data.id;const salaryIdV2=salaryCreated.v2.data.id;
  await comparePaths('PUT',`/salary-structures/${salaryIdV1}`,`/salary-structures/${salaryIdV2}`,{structureName:'Parity Salary Structure Revised',annualCtc:780000,monthlyGross:65000,revisionReason:'Annual compensation update'});
  const [v1BankRows,v2BankRows,v1StatutoryRows,v2StatutoryRows,v1SalaryRows,v2SalaryRows]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT account_holder_name,bank_name,branch_name,account_number,ifsc_code,account_type,payment_mode,is_primary,is_verified,effective_from,effective_to,version_no,metadata FROM employee_bank_details WHERE employee_payroll_profile_id=$1 ORDER BY version_no',v1ProfileId),
    v2Clients.payroll.$queryRawUnsafe('SELECT account_holder_name,bank_name,branch_name,account_number,ifsc_code,account_type,payment_mode,is_primary,is_verified,effective_from,effective_to,version_no,metadata FROM employee_bank_details WHERE employee_payroll_profile_id=$1 ORDER BY version_no',v2ProfileId),
    v1Clients.payroll.$queryRawUnsafe('SELECT pan,aadhaar,uan,esic_number,pf_member,eps_eligible,esi_eligible,professional_tax_applicable,lwf_applicable,tax_regime,declaration_submitted,effective_from,effective_to,version_no,metadata FROM employee_statutory_details WHERE employee_payroll_profile_id=$1 ORDER BY version_no',v1ProfileId),
    v2Clients.payroll.$queryRawUnsafe('SELECT pan,aadhaar,uan,esic_number,pf_member,eps_eligible,esi_eligible,professional_tax_applicable,lwf_applicable,tax_regime,declaration_submitted,effective_from,effective_to,version_no,metadata FROM employee_statutory_details WHERE employee_payroll_profile_id=$1 ORDER BY version_no',v2ProfileId),
    v1Clients.payroll.$queryRawUnsafe('SELECT structure_code,structure_name,annual_ctc,monthly_gross,basic_pay,variable_pay,is_current,effective_from,effective_to,version_no,metadata FROM employee_salary_structures WHERE employee_payroll_profile_id=$1 ORDER BY version_no',v1ProfileId),
    v2Clients.payroll.$queryRawUnsafe('SELECT structure_code,structure_name,annual_ctc,monthly_gross,basic_pay,variable_pay,is_current,effective_from,effective_to,version_no,metadata FROM employee_salary_structures WHERE employee_payroll_profile_id=$1 ORDER BY version_no',v2ProfileId),
  ]);
  assert.deepEqual(normalize(v2BankRows),normalize(v1BankRows),'bank detail versions persist identically');
  assert.deepEqual(normalize(v2StatutoryRows),normalize(v1StatutoryRows),'statutory detail versions persist identically');
  assert.deepEqual(normalize(v2SalaryRows),normalize(v1SalaryRows),'salary structure revisions persist identically');
  await comparePaths('GET',`/employee-profiles/${v1ProfileId}`,`/employee-profiles/${v2ProfileId}`);
  await comparePaths('DELETE',`/salary-structures/${salaryIdV1}`,`/salary-structures/${salaryIdV2}`);
  const [v1DeletedSalary,v2DeletedSalary]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT is_current,effective_to FROM employee_salary_structures WHERE id=$1',salaryIdV1),
    v2Clients.payroll.$queryRawUnsafe('SELECT is_current,effective_to FROM employee_salary_structures WHERE id=$1',salaryIdV2),
  ]);
  assert.deepEqual(normalize(v2DeletedSalary),normalize(v1DeletedSalary),'salary structure deactivation state matches');
  await comparePaths('DELETE',`/employee-profiles/${v1ProfileId}`,`/employee-profiles/${v2ProfileId}`);
  const [v1DeletedProfile,v2DeletedProfile]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT id FROM employee_payroll_profiles WHERE id=$1',v1ProfileId),
    v2Clients.payroll.$queryRawUnsafe('SELECT id FROM employee_payroll_profiles WHERE id=$1',v2ProfileId),
  ]);
  assert.deepEqual(v1DeletedProfile,[]);assert.deepEqual(v2DeletedProfile,[]);
  const profileSeed=async(prisma,tenantId,payGroupId)=>{
    const [{id:profileId}]=await prisma.$queryRawUnsafe(`INSERT INTO employee_payroll_profiles (tenant_id,employee_external_id,employee_code,pay_group_id,payroll_status,tax_regime,date_of_joining,cost_center_code,metadata,created_by,updated_by) VALUES ($1,$2,$3,$4,'active','new','2020-01-01','ENG','{}'::jsonb,$5,$5) RETURNING id`,tenantId,employeeExternalId,'P-001',payGroupId,actorId);
    await prisma.$executeRawUnsafe(`INSERT INTO employee_salary_structures (tenant_id,employee_payroll_profile_id,structure_code,structure_name,annual_ctc,monthly_gross,basic_pay,variable_pay,is_current,effective_from,version_no,metadata,created_by,updated_by) VALUES ($1,$2,'PARITY-SALARY','Parity Salary',600000,50000,20000,0,true,'2020-01-01',1,'{}'::jsonb,$3,$3)`,tenantId,profileId,actorId);
    await prisma.$executeRawUnsafe(`INSERT INTO payroll_attendance_snapshots (tenant_id,pay_month,organization_external_id,employee_external_id,employee_payroll_profile_id,timezone,calendar_days,working_days,present_days,payable_days,attendance_minutes,created_by,updated_by) VALUES ($1,'2026-10',$2,$3,$4,'Asia/Kolkata',31,23,23,31,11040,$5,$5)`,tenantId,identityOrganization,employeeExternalId,profileId,actorId);
  };
  await Promise.all([profileSeed(v1Clients.payroll,v1TenantRows[0].id,v1PayGroupId),profileSeed(v2Clients.payroll,v2TenantRows[0].id,v2PayGroupId)]);
  await comparePaths('GET',`/attendance-snapshots?month=2026-10&employeeId=${employeeExternalId}`,`/attendance-snapshots?month=2026-10&employeeId=${employeeExternalId}`);
  await comparePaths('GET','/attendance-snapshots?month=2026-10','/attendance-snapshots?month=2026-10');

  const runInput=payGroupId=>({payGroupId,payMonth:'2026-10',runType:'regular',runCode:'PARITY-RUN',runName:'Parity Run',employeeIds:[employeeExternalId]});
  const runResults=await compare('POST','/runs',runInput(v1PayGroupId),runInput(v2PayGroupId),{'idempotency-key':'payroll-parity-create-run'});
  const v1RunId=runResults.v1.data.id; const v2RunId=runResults.v2.data.id;
  assert.equal(Number(runResults.v1.data.seededEmployees),1);
  const runListQuery=`?payMonth=2026-10&status=draft&payGroupId=${v1PayGroupId}&limit=20&offset=0`;
  const runListQueryV2=`?payMonth=2026-10&status=draft&payGroupId=${v2PayGroupId}&limit=20&offset=0`;
  await comparePaths('GET',`/runs${runListQuery}`,`/runs${runListQueryV2}`);
  await comparePaths('GET',`/runs/${v1RunId}`,`/runs/${v2RunId}`);
  const invalidValidation=await comparePaths('POST',`/runs/${v1RunId}/validate`,`/runs/${v2RunId}/validate`,{employeeIds:['507f1f77bcf86cd799439099']});
  assert.equal(invalidValidation.v1.code,400,'V1 rejects validation when the employee filter matches no run employee');
  const [v1UnchangedRun,v2UnchangedRun]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT status,error_count,warning_count FROM payroll_runs WHERE id=$1',v1RunId),
    v2Clients.payroll.$queryRawUnsafe('SELECT status,error_count,warning_count FROM payroll_runs WHERE id=$1',v2RunId),
  ]);
  assert.deepEqual(v2UnchangedRun,v1UnchangedRun,'failed validation does not change run state');
  const computed=await comparePaths('POST',`/runs/${v1RunId}/compute`,`/runs/${v2RunId}/compute`,{}, {}, {'idempotency-key':'payroll-parity-compute-run'});
  await comparePaths('POST',`/runs/${v1RunId}/preview`,`/runs/${v2RunId}/preview`,{includeComponents:true,includeEmployees:true,limitEmployees:100});
  await comparePaths('GET',`/runs/${v1RunId}/employee-breakdown?limit=100`,`/runs/${v2RunId}/employee-breakdown?limit=100`);
  const [v1RunRows,v2RunRows]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT run_code,pay_month,status,employee_count,processed_employee_count,gross_total,deduction_total,reimbursement_total,employer_contribution_total,net_pay_total,error_count,warning_count FROM payroll_runs WHERE id = $1',v1RunId),
    v2Clients.payroll.$queryRawUnsafe('SELECT run_code,pay_month,status,employee_count,processed_employee_count,gross_total,deduction_total,reimbursement_total,employer_contribution_total,net_pay_total,error_count,warning_count FROM payroll_runs WHERE id = $1',v2RunId),
  ]);
  assert.deepEqual(v2RunRows,v1RunRows);
  const [v1Rows,v2Rows]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT employee_external_id,payroll_status,payable_days,lop_days,gross_earnings,total_deductions,reimbursement_amount,employer_contributions,net_pay,error_message,warnings FROM payroll_run_employees WHERE payroll_run_id = $1 ORDER BY employee_external_id',v1RunId),
    v2Clients.payroll.$queryRawUnsafe('SELECT employee_external_id,payroll_status,payable_days,lop_days,gross_earnings,total_deductions,reimbursement_amount,employer_contributions,net_pay,error_message,warnings FROM payroll_run_employees WHERE payroll_run_id = $1 ORDER BY employee_external_id',v2RunId),
  ]);
  assert.equal(v1Rows.length,1); assert.deepEqual(v2Rows,v1Rows);
  const [v1Components,v2Components]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT component_scope,component_code,amount FROM payroll_run_components WHERE payroll_run_employee_id IN (SELECT id FROM payroll_run_employees WHERE payroll_run_id = $1) ORDER BY component_scope,component_code',v1RunId),
    v2Clients.payroll.$queryRawUnsafe('SELECT component_scope,component_code,amount FROM payroll_run_components WHERE payroll_run_employee_id IN (SELECT id FROM payroll_run_employees WHERE payroll_run_id = $1) ORDER BY component_scope,component_code',v2RunId),
  ]);
  assert.ok(v1Components.length>0); assert.deepEqual(v2Components,v1Components);
  assert.equal(v1RunRows[0].status,'ready_for_approval');
  await comparePaths('POST',`/runs/${v1RunId}/recompute`,`/runs/${v2RunId}/recompute`,{}, {}, {'idempotency-key':'payroll-parity-recompute-run'});
  const [v1RecomputedRun,v2RecomputedRun,v1RecomputedEmployees,v2RecomputedEmployees]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT status,employee_count,processed_employee_count,gross_total,deduction_total,reimbursement_total,employer_contribution_total,net_pay_total,error_count,warning_count FROM payroll_runs WHERE id=$1',v1RunId),
    v2Clients.payroll.$queryRawUnsafe('SELECT status,employee_count,processed_employee_count,gross_total,deduction_total,reimbursement_total,employer_contribution_total,net_pay_total,error_count,warning_count FROM payroll_runs WHERE id=$1',v2RunId),
    v1Clients.payroll.$queryRawUnsafe('SELECT employee_external_id,payroll_status,payable_days,lop_days,gross_earnings,total_deductions,reimbursement_amount,employer_contributions,net_pay,error_message,warnings FROM payroll_run_employees WHERE payroll_run_id=$1 ORDER BY employee_external_id',v1RunId),
    v2Clients.payroll.$queryRawUnsafe('SELECT employee_external_id,payroll_status,payable_days,lop_days,gross_earnings,total_deductions,reimbursement_amount,employer_contributions,net_pay,error_message,warnings FROM payroll_run_employees WHERE payroll_run_id=$1 ORDER BY employee_external_id',v2RunId),
  ]);
  assert.deepEqual(v2RecomputedRun,v1RecomputedRun,'forced recompute preserves V1 run result');
  assert.deepEqual(v2RecomputedEmployees,v1RecomputedEmployees,'forced recompute preserves V1 employee result');
  const transitions=[
    ['POST',`/runs/${v1RunId}/submit`,`/runs/${v2RunId}/submit`,{},'ready_for_approval'],
    ['POST',`/runs/${v1RunId}/reject`,`/runs/${v2RunId}/reject`,{reason:'Correct payroll inputs before approval'},'validation_failed'],
    ['POST',`/runs/${v1RunId}/submit`,`/runs/${v2RunId}/submit`,{},'ready_for_approval'],
    ['POST',`/runs/${v1RunId}/approve`,`/runs/${v2RunId}/approve`,{},'approved'],
    ['POST',`/runs/${v1RunId}/lock`,`/runs/${v2RunId}/lock`,{},'locked'],
    ['POST',`/runs/${v1RunId}/reopen`,`/runs/${v2RunId}/reopen`,{reason:'Reopen for parity verification'},'draft'],
  ];
  for(const [method,v1Path,v2Path,body,status] of transitions){
    await comparePaths(method,v1Path,v2Path,body);
    const [v1Status,v2Status]=await Promise.all([
      v1Clients.payroll.$queryRawUnsafe('SELECT status FROM payroll_runs WHERE id = $1',v1RunId),
      v2Clients.payroll.$queryRawUnsafe('SELECT status FROM payroll_runs WHERE id = $1',v2RunId),
    ]);
    assert.equal(v1Status[0]?.status,status,`V1 ${v1Path} stored status`);
    assert.equal(v2Status[0]?.status,status,`V2 ${v2Path} stored status`);
    if(status==='locked'){
      await comparePayslip(`/runs/${v1RunId}/payslips/${employeeExternalId}`,`/runs/${v2RunId}/payslips/${employeeExternalId}`);
      await comparePayslip(`/payslips/monthly?month=2026-10&employeeExternalId=${employeeExternalId}`,`/payslips/monthly?month=2026-10&employeeExternalId=${employeeExternalId}`);
      await compareSelfResponse('/payslips/my/monthly?month=2026-10','/payslips/my/monthly?month=2026-10');
      await compareSelfResponse('/payslips/my/months','/payslips/my/months');
      const selfRuns=await compareSelfResponse('/payslips/my/runs','/payslips/my/runs');
      await compareSelfResponse(`/payslips/my/runs/${v1RunId}`,`/payslips/my/runs/${v2RunId}`);
      assert.equal(selfRuns.v1.data[0]?.runId,v1RunId,'self payslip runs include the locked run');
      assert.equal(selfRuns.v1.data[0]?.employeeExternalId,employeeExternalId,'self payslip run uses the linked employee ID');
      const reportRoutes=[
        ['/reports/payroll-register',''],
        ['/reports/bank-transfer-export',''],
        ['/reports/bank-transfer-export','&exportFormat=csv'],
        ['/reports/deduction-summary',''],
        ['/reports/employer-contribution-summary',''],
        ['/reports/cost-center-totals',''],
      ];
      for(const [reportPath,extraQuery] of reportRoutes){
        await comparePaths('GET',`${reportPath}?runId=${v1RunId}${extraQuery}`,`${reportPath}?runId=${v2RunId}${extraQuery}`);
      }
    }
  }
  const invalidTransition=await comparePaths('POST',`/runs/${v1RunId}/lock`,`/runs/${v2RunId}/lock`,{});
  assert.equal(invalidTransition.v1.code,409,'V1 rejects locking a reopened draft');
  const [v1AfterInvalid,v2AfterInvalid]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT status FROM payroll_runs WHERE id = $1',v1RunId),
    v2Clients.payroll.$queryRawUnsafe('SELECT status FROM payroll_runs WHERE id = $1',v2RunId),
  ]);
  assert.equal(v1AfterInvalid[0]?.status,'draft');
  assert.equal(v2AfterInvalid[0]?.status,'draft');
  await comparePaths('GET',`/runs/${v1RunId}/audit`,`/runs/${v2RunId}/audit`);
  const [v1Audit,v2Audit]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT action,action_status,from_status,to_status,reason FROM payroll_run_audit_entries WHERE payroll_run_id = $1 ORDER BY created_at,id',v1RunId),
    v2Clients.payroll.$queryRawUnsafe('SELECT action,action_status,from_status,to_status,reason FROM payroll_run_audit_entries WHERE payroll_run_id = $1 ORDER BY created_at,id',v2RunId),
  ]);
  assert.deepEqual(v2Audit,v1Audit);
  assert.ok(v1Audit.some(entry=>entry.action==='reject'&&entry.from_status==='ready_for_approval'&&entry.to_status==='validation_failed'&&entry.reason==='Correct payroll inputs before approval'),'rejection is persisted in the audit trail');
  const snapshotGeneration=await compare('POST','/attendance-snapshots/generate',{month:'2026-10',employeeIds:[employeeExternalId],forceRebuild:true});
  assert.equal(snapshotGeneration.v1.data.generatedCount,1);
  const [v1Snapshot,v2Snapshot,v1SnapshotDays,v2SnapshotDays]=await Promise.all([
    v1Clients.payroll.$queryRawUnsafe('SELECT pay_month,employee_external_id,calendar_days,working_days,present_days,half_days,absent_days,paid_leave_days,unpaid_leave_days,week_off_days,holiday_days,lop_days,payable_days,overtime_minutes,late_by_minutes,early_checkout_minutes,attendance_minutes,generation_status,source_hash,metadata FROM payroll_attendance_snapshots WHERE employee_external_id=$1 AND pay_month=$2',employeeExternalId,'2026-10'),
    v2Clients.payroll.$queryRawUnsafe('SELECT pay_month,employee_external_id,calendar_days,working_days,present_days,half_days,absent_days,paid_leave_days,unpaid_leave_days,week_off_days,holiday_days,lop_days,payable_days,overtime_minutes,late_by_minutes,early_checkout_minutes,attendance_minutes,generation_status,source_hash,metadata FROM payroll_attendance_snapshots WHERE employee_external_id=$1 AND pay_month=$2',employeeExternalId,'2026-10'),
    v1Clients.payroll.$queryRawUnsafe('SELECT day_date,day_of_week,payable_units,lop_units,attendance_minutes,overtime_minutes,late_by_minutes,early_checkout_minutes,week_off_applied,is_holiday,is_leave,day_status,metadata FROM payroll_attendance_snapshot_days WHERE snapshot_id=(SELECT id FROM payroll_attendance_snapshots WHERE employee_external_id=$1 AND pay_month=$2)',employeeExternalId,'2026-10'),
    v2Clients.payroll.$queryRawUnsafe('SELECT day_date,day_of_week,payable_units,lop_units,attendance_minutes,overtime_minutes,late_by_minutes,early_checkout_minutes,week_off_applied,is_holiday,is_leave,day_status,metadata FROM payroll_attendance_snapshot_days WHERE snapshot_id=(SELECT id FROM payroll_attendance_snapshots WHERE employee_external_id=$1 AND pay_month=$2)',employeeExternalId,'2026-10'),
  ]);
  assert.deepEqual(normalize(v2Snapshot),normalize(v1Snapshot),'generated snapshot persists matching totals and source metadata');
  assert.deepEqual(normalize(v2SnapshotDays),normalize(v1SnapshotDays),'generated snapshot persists matching per-day rows');
});
