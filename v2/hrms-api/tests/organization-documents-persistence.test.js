import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createOrganizationDocumentModels } from '../src/modules/organization-documents/organization-document.models.js';
import { createOrganizationDocumentService } from '../src/modules/organization-documents/organization-document.service.js';

test('Mongoose mapping retains the v1 physical collection and indexes without startup index creation', async t => {
  const connection=mongoose.createConnection();
  t.after(()=>connection.close());
  const {OrganizationDocument}=createOrganizationDocumentModels(connection);
  assert.equal(OrganizationDocument.collection.collectionName,'organization_documents');
  assert.equal(OrganizationDocument.schema.options.autoIndex,false);
  assert.equal(OrganizationDocument.schema.options.autoCreate,false);
  assert.ok(OrganizationDocument.schema.indexes().some(([keys,options])=>keys.organizationId===1&&keys.documentKey===1&&options.unique&&options.partialFilterExpression.isDeleted===false));
});

test('delete scopes by authenticated organization and keeps DB deletion if provider cleanup fails', async () => {
  let filter; let saved=false; let removedAsset;
  const document={_id:'doc',filePath:'asset-url',publicId:'asset-id',resourceType:'raw',fileType:'application/pdf',fileName:'policy.pdf',fileSize:12,documentNumber:'N',expiryDate:null,remarks:'',uploadHistory:[],isDeleted:false,save:async function(){saved=true;return this;}};
  const models={OrganizationDocument:{findOne:query=>{filter=query;return Promise.resolve(document);}}};
  const service=createOrganizationDocumentService({models,cloudinary:{deleteAsset:async(id,options)=>{removedAsset={id,options};throw new Error('provider unavailable');}}});
  const result=await service.delete({params:{id:'doc'},user:{organizationId:'org-1',userId:'user-1'}});
  assert.deepEqual(filter,{_id:'doc',organizationId:'org-1',isDeleted:false});
  assert.equal(saved,true);
  assert.equal(document.isDeleted,true);
  assert.equal(document.deletedBy,'user-1');
  assert.equal(document.uploadHistory[0].action,'DELETE');
  assert.deepEqual(removedAsset,{id:'asset-id',options:{resourceType:'raw'}});
  assert.deepEqual(result,{deleted:true});
});

function query(value){return {select(){return this;},lean:async()=>value,then(resolve,reject){return Promise.resolve(value).then(resolve,reject);}};}

test('expiry notification skips memberships notified within the prior day', async () => {
  const current=new Date('2026-11-01T00:00:00Z'); let notificationWrites=0;
  const models={
    OrganizationDocument:{find:()=>query([{_id:'doc1',organizationId:'org1',documentName:'PAN',documentKey:'COMPANY_PAN',expiryDate:new Date('2026-11-15T00:00:00Z')}])},
    Role:{find:()=>({select(){return this;},lean:async()=>[{_id:'role1'}]})},
    OrgUser:{find:()=>({select(){return this;},lean:async()=>[{userId:'user1'}]})},
    Notification:{findOne:()=>query({_id:'recent'}),create:async()=>{notificationWrites++;}},
  };
  const service=createOrganizationDocumentService({models,now:()=>current});
  assert.equal(await service.notifyExpiringDocuments(),0);
  assert.equal(notificationWrites,0);
});

test('expiry notifications use the injected notification delivery path', async () => {
  const current=new Date('2026-11-01T00:00:00Z'),sent=[];
  const models={
    OrganizationDocument:{find:()=>query([{_id:'doc1',organizationId:'org1',documentName:'PAN',documentKey:'COMPANY_PAN',expiryDate:new Date('2026-11-15T00:00:00Z')}])},
    Role:{find:()=>({select(){return this;},lean:async()=>[{_id:'role1'}]})},
    OrgUser:{find:()=>({select(){return this;},lean:async()=>[{userId:'user1'}]})},
    Notification:{findOne:()=>query(null),create:async()=>{throw new Error('direct persistence path should not be used');}},
  };
  const service=createOrganizationDocumentService({models,notify:async payload=>sent.push(payload),now:()=>current});
  assert.equal(await service.notifyExpiringDocuments(),1);
  assert.equal(sent[0].type,'organization_document_expiry');
  assert.equal(sent[0].recipientUserId,'user1');
  assert.equal(sent[0].meta.documentId,'doc1');
});
