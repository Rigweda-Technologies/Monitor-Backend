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

const fixture=({failOnModel=null}={})=>{
  const organizationId=new mongoose.Types.ObjectId(),sharedOrganizationId=new mongoose.Types.ObjectId(),actorId=new mongoose.Types.ObjectId(),soleId=new mongoose.Types.ObjectId(),sharedId=new mongoose.Types.ObjectId();
  const state={organization:{_id:organizationId,code:'HARD-DELETE',status:'active'},users:[
    {_id:soleId,email:'sole@example.test',organizationIds:[organizationId],activeOrganizationId:organizationId,tokenList:[{organizationId,status:'active'}],async save(){}},
    {_id:sharedId,email:'shared@example.test',organizationIds:[organizationId,sharedOrganizationId],activeOrganizationId:organizationId,tokenList:[{organizationId,status:'active'},{organizationId:sharedOrganizationId,status:'active'}],async save(){}},
  ],records:{departments:[{organizationId,name:'Owned Department'},{organizationId:sharedOrganizationId,name:'Retained Department'}],employees:[{organizationId,employeeCode:'HD-1'},{organizationId:sharedOrganizationId,employeeCode:'HD-2'}]},organizationDeleted:false,deletedUsers:[]};
  const scopedModels={};
  for(const [name,rows] of Object.entries(state.records))scopedModels[name]={schema:{path:key=>key==='organizationId'?{}:null},deleteMany:async filter=>{if(name===failOnModel)throw new Error('simulated scoped cleanup failure');const before=rows.length;state.records[name]=rows.filter(row=>String(row.organizationId)!==String(filter.organizationId));return{deletedCount:before-state.records[name].length};}};
  const models={
    OrgUser:{find:()=>({populate:async()=>[{roleIds:[{slug:'superadmin'}]}]})},
    Organization:{findById:async id=>String(id)===String(organizationId)?state.organization:null,deleteOne:async filter=>{if(String(filter._id)!==String(organizationId))return{deletedCount:0};state.organizationDeleted=true;return{deletedCount:1};}},
    User:{
      find:async filter=>state.users.filter(user=>filter.$or.some(branch=>branch.organizationIds&&user.organizationIds.some(id=>String(id)===String(organizationId))||String(user.softDeleteMeta?.organizationId||'')===String(organizationId))),
      deleteOne:async filter=>{const index=state.users.findIndex(user=>String(user._id)===String(filter._id));if(index<0)return{deletedCount:0};state.deletedUsers.push(String(state.users[index]._id));state.users.splice(index,1);return{deletedCount:1};},
    },
    scopedModels,
  };
  return{organizationId,sharedOrganizationId,actorId,soleId,sharedId,state,models};
};

test('V1 and V2 organization hard-delete responses and user/data cleanup match',async()=>{
  const v1=fixture(),v2=fixture();
  const v1Models={...v1.models,Organization:{...v1.models.Organization,deleteOne:async filter=>{if(String(filter._id)!==String(v1.organizationId))return{deletedCount:0};v1.state.organizationDeleted=true;return{deletedCount:1};}},User:v1.models.User};
  const v2Models={...v2.models,Organization:{...v2.models.Organization,deleteOne:async filter=>{if(String(filter._id)!==String(v2.organizationId))return{deletedCount:0};v2.state.organizationDeleted=true;return{deletedCount:1};}}};
  const legacy=loadLegacyService({
    './organization.model':v1Models.Organization,'../users/user.model':v1Models.User,'./org-user.model':v1Models.OrgUser,
    '../roles/role.model':{},'../employees/employee.model':{},'../orgSettings/orgSettings.model':{},
    '../leaveBalances/leaveBalance.service':{},'../roles/role.seeder':{},'../../config/payrollDb':{getPayrollPgPool:async()=>null,isPayrollDbEnabled:()=>false},
    mongoose:{modelNames:()=>Object.keys(v1Models.scopedModels),model:name=>v1Models.scopedModels[name]},
  });
  const v2Service=createOrganizationService({models:v2Models,isSuperAdmin:async()=>true});
  const input=(source)=>({organizationId:source.organizationId,action:'hard_delete',confirmationCode:'hard-delete',actorUserId:source.actorId});
  const [left,right]=await Promise.all([legacy.applyOrganizationLifecycleAction(input(v1)),v2Service.lifecycleAction(input(v2))]);
  assert.deepEqual({...right,organizationId:'<organization>'},{...left,organizationId:'<organization>'});
  for(const source of [v1,v2]){
    assert.equal(source.state.organizationDeleted,true);
    assert.deepEqual(source.state.records,{departments:[{organizationId:source.sharedOrganizationId,name:'Retained Department'}],employees:[{organizationId:source.sharedOrganizationId,employeeCode:'HD-2'}]});
    assert.equal(source.state.users.length,1);
    assert.equal(String(source.state.users[0]._id),String(source.sharedId));
    assert.deepEqual(source.state.users[0].organizationIds.map(String),[String(source.sharedOrganizationId)]);
    assert.equal(String(source.state.users[0].activeOrganizationId),String(source.sharedOrganizationId));
    assert.deepEqual(source.state.users[0].tokenList.map(token=>String(token.organizationId)),[String(source.sharedOrganizationId)]);
  }
  assert.deepEqual(v1.state.deletedUsers,[String(v1.soleId)]);
  assert.deepEqual(v2.state.deletedUsers,[String(v2.soleId)]);
  assert.equal(left.detachedUsers,2);
  assert.equal(left.deletedUsers,1);
  assert.deepEqual(left.deletedByModel,{departments:1,employees:1});
});

test('V1 and V2 hard-delete failures leave the same partial Mongo state before user and organization cleanup',async()=>{
  const v1=fixture({failOnModel:'employees'}),v2=fixture({failOnModel:'employees'});
  const legacy=loadLegacyService({
    './organization.model':v1.models.Organization,'../users/user.model':v1.models.User,'./org-user.model':v1.models.OrgUser,
    '../roles/role.model':{},'../employees/employee.model':{},'../orgSettings/orgSettings.model':{},
    '../leaveBalances/leaveBalance.service':{},'../roles/role.seeder':{},'../../config/payrollDb':{getPayrollPgPool:async()=>null,isPayrollDbEnabled:()=>false},
    mongoose:{modelNames:()=>Object.keys(v1.models.scopedModels),model:name=>v1.models.scopedModels[name]},
  });
  const v2Service=createOrganizationService({models:v2.models,isSuperAdmin:async()=>true});
  const input=source=>({organizationId:source.organizationId,action:'hard_delete',confirmationCode:'hard-delete',actorUserId:source.actorId});
  const [v1Error,v2Error]=await Promise.all([
    legacy.applyOrganizationLifecycleAction(input(v1)).then(()=>null,error=>error),
    v2Service.lifecycleAction(input(v2)).then(()=>null,error=>error),
  ]);
  assert.equal(v1Error?.message,'simulated scoped cleanup failure');
  assert.equal(v2Error?.message,'simulated scoped cleanup failure');
  for(const source of [v1,v2]){
    assert.deepEqual(source.state.records.departments,[{organizationId:source.sharedOrganizationId,name:'Retained Department'}]);
    assert.deepEqual(source.state.records.employees,[{organizationId:source.organizationId,employeeCode:'HD-1'},{organizationId:source.sharedOrganizationId,employeeCode:'HD-2'}]);
    assert.equal(source.state.organizationDeleted,false);
    assert.deepEqual(source.state.deletedUsers,[]);
    assert.equal(source.state.users.length,2);
    assert.deepEqual(source.state.users.map(user=>user.organizationIds.map(String)),[[String(source.organizationId)],[String(source.organizationId),String(source.sharedOrganizationId)]]);
  }
});
