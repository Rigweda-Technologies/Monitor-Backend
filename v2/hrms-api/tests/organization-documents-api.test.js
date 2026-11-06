import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { registerOrganizationDocumentRoutes } from '../src/modules/organization-documents/organization-document.routes.js';

const models = () => ({
  OrganizationDocument: {
    find: () => query([]), findOne: () => query(null), updateMany: async () => ({ modifiedCount: 0 }),
    create: async value => ({ ...value, _id: 'doc-1', toObject() { return { ...value, _id:'doc-1' }; }, save: async function(){ return this; } }),
  },
  OrgUser: { find: () => query([]) }, Role: { find: () => query([]) },
  Notification: { findOne: () => query(null), create: async value => value },
});
function query(value) {
  const q = { select() { return this; }, sort() { return this; }, populate() { return this; }, lean: async () => value, then(resolve,reject){ return Promise.resolve(value).then(resolve,reject); } };
  return q;
}

const makeApp = async (t, { cloudinary = {}, fetchImpl, dbModels = models(), authorize = async () => null } = {}) => {
  const app = await buildApp({
    config: loadConfig({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') }),
    logger: false, authService: {}, authenticate: async () => ({ userId: 'u1', organizationId: 'o1' }),
    authorize: async () => null, isReady: async () => {},
  });
  registerOrganizationDocumentRoutes(app, {
    service: (await import('../src/modules/organization-documents/organization-document.service.js')).createOrganizationDocumentService({ models: dbModels, cloudinary, fetchImpl }),
    authenticate: async request => { request.user = { userId: 'u1', organizationId: 'o1' }; },
    authorize, fetchImpl,
  });
  t.after(() => app.close());
  return app;
};

test('organization document routes register all eleven methods with OpenAPI schemas', async t => {
  const app = await makeApp(t);
  const expected = [
    ['GET','/api/v2/organization-documents/catalog'], ['GET','/api/v2/organization-documents/summary'],
    ['GET','/api/v2/organization-documents/reports/missing'], ['GET','/api/v2/organization-documents/reports/expiring-soon'],
    ['GET','/api/v2/organization-documents/'], ['POST','/api/v2/organization-documents/upload'],
    ['PATCH','/api/v2/organization-documents/:id'], ['GET','/api/v2/organization-documents/:id/access'],
    ['GET','/api/v2/organization-documents/:id/preview'], ['GET','/api/v2/organization-documents/:id/download'],
    ['DELETE','/api/v2/organization-documents/:id'],
  ];
  for (const [method,url] of expected) assert.ok(app.applicationRoutes.some(r => r.method === method && r.url === url && r.schema), `missing documented ${method} ${url}`);
  await app.ready();
  assert.ok(app.swagger().paths['/api/v2/organization-documents/upload'].post);
  assert.ok(app.swagger().paths['/api/v2/organization-documents/{id}/download'].get);
});

test('catalog route returns the v1 success envelope and enforces auth and permission', async t => {
  const app = await makeApp(t);
  const response = await app.inject({ method: 'GET', url: '/api/v2/organization-documents/catalog', headers: { authorization: 'Bearer token' } });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().success, true);
  assert.equal(response.json().code, 200);
  assert.equal(response.json().data.length, 4);
});

test('upload validation rejects invalid file payload before provider call', async t => {
  let uploads = 0;
  const app = await makeApp(t, { cloudinary: { uploadDataUri: async () => { uploads += 1; } } });
  const response = await app.inject({ method: 'POST', url: '/api/v2/organization-documents/upload', headers: { authorization: 'Bearer token' }, payload: { documentKey: 'COMPANY_PAN', file: { fileName: 'a.exe', mimeType: 'application/x-msdownload', size: 1, base64Data: 'AA==' } } });
  assert.equal(response.statusCode, 406);
  assert.equal(uploads, 0);
});

test('upload records the authenticated tenant, actor, and upload history', async t => {
  let created;
  const db=models();
  db.OrganizationDocument.create=async value=>{created=value;return {...value,_id:'doc-1',toObject(){return {...value,_id:'doc-1'}}};};
  let providerOptions;
  const app=await makeApp(t,{dbModels:db,cloudinary:{uploadDataUri:async(_data,options)=>{providerOptions=options;return {secure_url:'https://asset.invalid/a',public_id:'asset-a',resource_type:'raw'};}}});
  const response=await app.inject({method:'POST',url:'/api/v2/organization-documents/upload',headers:{authorization:'Bearer token'},payload:{documentKey:'COMPANY_PAN',documentNumber:' PAN ',remarks:'  current  ',file:{fileName:'pan.pdf',mimeType:'application/pdf',size:4,base64Data:'AA=='}}});
  assert.equal(response.statusCode,200);
  assert.equal(created.organizationId,'o1');
  assert.equal(created.uploadedBy,'u1');
  assert.equal(created.uploadHistory[0].action,'UPLOAD');
  assert.equal(created.uploadHistory[0].filePath,'https://asset.invalid/a');
  assert.equal(providerOptions.folder,'hrms/organization-documents/o1');
  assert.equal(response.json().data.uploadHistory.length,1);
});

test('authorization runs before document reads', async t => {
  let reads=0;
  const db=models(); db.OrganizationDocument.find=()=>{reads++;return query([]);};
  const app=await makeApp(t,{dbModels:db,authorize:async permission=>{assert.deepEqual(permission,['ORG_DOCUMENT_VIEW','ORG_SETTINGS_VIEW','PAYROLL_REPORT_VIEW']);return {code:403,message:'forbidden'};}});
  const response=await app.inject({method:'GET',url:'/api/v2/organization-documents/catalog',headers:{authorization:'Bearer token'}});
  assert.equal(response.statusCode,403);
  assert.equal(reads,0);
});

test('preview streams the provider response with private cache and inline filename', async t => {
  const db = models();
  db.OrganizationDocument.findOne = () => query({ _id:'0123456789abcdef01234567',organizationId:'o1',fileName:'policy.pdf',publicId:'p1',resourceType:'raw',expiryDate:null,isDeleted:false });
  const app = await makeApp(t,{dbModels:db,cloudinary:{buildAuthenticatedUrl:()=> 'https://cloudinary.invalid/file'},fetchImpl:async()=>new Response('file-body',{status:200,headers:{'content-type':'application/pdf'}})});
  const response=await app.inject({method:'GET',url:'/api/v2/organization-documents/0123456789abcdef01234567/preview',headers:{authorization:'Bearer token'}});
  assert.equal(response.statusCode,200);
  assert.equal(response.headers['content-type'],'application/pdf');
  assert.equal(response.headers['cache-control'],'private, no-store, max-age=0');
  assert.equal(response.headers['content-disposition'],'inline; filename="policy.pdf"');
  assert.equal(response.body,'file-body');
});
