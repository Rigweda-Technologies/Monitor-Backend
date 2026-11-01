import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { createModels } from '../src/modules/auth/auth.models.js';
import { createPasswords } from '../src/integrations/passwords.js';
import { createSystemBootstrapService } from '../src/modules/organizations/system-bootstrap.service.js';

const baseUri=process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
const fixture = ({ existingUser=null, failMembership=false }={}) => {
  const state={organization:null,permission:null,role:null,users:existingUser?[existingUser]:[],memberships:[],deletedUsers:[]};
  const models={
    Organization:{findOne:async()=>state.organization,create:async value=>(state.organization={_id:'system-id',...value})},
    Permission:{findOne:async()=>state.permission,create:async value=>(state.permission={_id:'permission-id',...value})},
    Role:{findOne:async()=>state.role,create:async value=>(state.role={_id:'role-id',...value})},
    User:{findOne:async({email})=>state.users.find(user=>user.email===email)||null,create:async value=>{const user={_id:'user-id',...value};state.users.push(user);return user;},deleteOne:async({ _id })=>{state.deletedUsers.push(_id);state.users=state.users.filter(user=>user._id!==_id);}},
    Membership:{findOne:async({userId,organizationId})=>state.memberships.find(item=>item.userId===userId&&item.organizationId===organizationId)||null,create:async value=>{if(failMembership)throw new Error('membership storage unavailable');const membership={_id:'membership-id',...value};state.memberships.push(membership);return membership;}},
  };
  return {state,models,bootstrap:createSystemBootstrapService({models,hashPassword:async password=>`hashed:${password}`})};
};

test('SYSTEM bootstrap creates V1-shaped records with a hashed operator password',async()=>{
  const {state,bootstrap}=fixture();
  const result=await bootstrap({email:' Admin@Example.test ',password:'a-long-synthetic-secret'});
  assert.deepEqual(result,{created:true,systemOrgId:'system-id',email:'admin@example.test'});
  assert.deepEqual(state.organization,{_id:'system-id',name:'SYSTEM',code:'SYSTEM',timezone:'Asia/Kolkata',currency:'USD',status:'active'});
  assert.deepEqual(state.permission,{_id:'permission-id',organizationId:'system-id',name:'ALL_ACCESS',code:'*',module:'SYSTEM'});
  assert.deepEqual(state.role,{_id:'role-id',organizationId:'system-id',name:'SuperAdmin',slug:'superadmin',permissionIds:['permission-id'],isSystemRole:true});
  assert.equal(state.users[0].password,'hashed:a-long-synthetic-secret');
  assert.deepEqual(state.users[0].organizationIds,['system-id']);
  assert.deepEqual(state.memberships,[{_id:'membership-id',userId:'user-id',organizationId:'system-id',roleIds:['role-id']}]);
});

test('SYSTEM bootstrap is an idempotent no-op for an already linked superadmin',async()=>{
  const existingUser={_id:'existing-user',email:'admin@example.test',organizationIds:['system-id']};
  const {state,bootstrap}=fixture({existingUser});
  state.organization={_id:'system-id',code:'SYSTEM'};
  state.role={_id:'role-id',organizationId:'system-id',slug:'superadmin'};
  state.memberships.push({userId:'existing-user',organizationId:'system-id',roleIds:['role-id']});
  assert.deepEqual(await bootstrap({email:'admin@example.test',password:'a-long-synthetic-secret'}),{created:false,systemOrgId:'system-id',email:'admin@example.test'});
  assert.equal(state.users.length,1);
  assert.equal(state.memberships.length,1);
});

test('SYSTEM bootstrap refuses to grant an existing unrelated account access',async()=>{
  const {state,bootstrap}=fixture({existingUser:{_id:'existing-user',email:'admin@example.test',organizationIds:['other-org']}});
  state.organization={_id:'system-id',code:'SYSTEM'};
  state.role={_id:'role-id',organizationId:'system-id',slug:'superadmin'};
  await assert.rejects(bootstrap({email:'admin@example.test',password:'a-long-synthetic-secret'}),/refusing to grant SYSTEM access/);
  assert.equal(state.memberships.length,0);
  assert.equal(state.users.length,1);
});

test('SYSTEM bootstrap removes its newly created user if membership persistence fails',async()=>{
  const {state,bootstrap}=fixture({failMembership:true});
  await assert.rejects(bootstrap({email:'admin@example.test',password:'a-long-synthetic-secret'}),/membership storage unavailable/);
  assert.deepEqual(state.deletedUsers,['user-id']);
  assert.equal(state.users.length,0);
});

test('SYSTEM bootstrap validates address and minimum password length before writes',async()=>{
  const {state,bootstrap}=fixture();
  await assert.rejects(bootstrap({email:'not-an-email',password:'a-long-synthetic-secret'}),/valid email address/);
  await assert.rejects(bootstrap({email:'admin@example.test',password:'short'}),/at least 12 characters/);
  assert.equal(state.organization,null);
});

test('bootstrap CLI refuses to connect without explicit operator credentials',async()=>{
  const child=spawn(process.execPath,['scripts/bootstrap-system.js'],{
    cwd:fileURLToPath(new URL('../',import.meta.url)),
    env:{PATH:process.env.PATH,MONGODB_URI:'',HRMS_BOOTSTRAP_EMAIL:'',HRMS_BOOTSTRAP_PASSWORD:''},
    stdio:['ignore','pipe','pipe'],
  });
  let output='';child.stdout.on('data',chunk=>{output+=chunk;});child.stderr.on('data',chunk=>{output+=chunk;});
  const [code]=await once(child,'exit');
  assert.equal(code,1);
  assert.match(output,/MONGODB_URI is required/);
});

test('SYSTEM bootstrap persists V1-shaped Mongo documents on an isolated local database',{skip:!baseUri,timeout:15000},async t=>{
  const base=new URL(baseUri);
  assert.ok(['localhost','127.0.0.1','::1'].includes(base.hostname),'isolated MongoDB must be local');
  assert.match(base.pathname,/[_-](test|isolated|ci)([_-]|$)/i,'database name must be isolated');
  base.pathname=`${base.pathname.replace(/\/$/,'')}_bootstrap_${process.pid}_${randomBytes(3).toString('hex')}`;
  const connection=await mongoose.createConnection(base.toString(),{autoCreate:false,autoIndex:false,serverSelectionTimeoutMS:3000}).asPromise();
  t.after(async()=>{await connection.dropDatabase();await connection.close();});
  const models=createModels(connection);
  const bootstrap=createSystemBootstrapService({models,hashPassword:createPasswords(4).hashPassword});
  const result=await bootstrap({email:'bootstrap@example.test',password:'a-long-synthetic-secret'});
  assert.equal(result.created,true);
  const [organization,permission,role,user]=await Promise.all([
    models.Organization.findOne({code:'SYSTEM'}).lean(),
    models.Permission.findOne({organizationId:result.systemOrgId,code:'*'}).lean(),
    models.Role.findOne({organizationId:result.systemOrgId,slug:'superadmin'}).lean(),
    models.User.findOne({email:'bootstrap@example.test'}).select('+password').lean(),
  ]);
  const membership=await models.Membership.findOne({userId:user._id,organizationId:result.systemOrgId}).lean();
  assert.equal(organization.currency,'USD');
  assert.equal(permission.module,'SYSTEM');
  assert.equal(role.isSystemRole,true);
  assert.equal(user.status,'active');
  assert.ok(await createPasswords(4).comparePassword('a-long-synthetic-secret',user.password));
  assert.deepEqual(membership.roleIds.map(String),[String(role._id)]);
});
