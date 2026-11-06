import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { createRequire } from 'node:module';
import mongoose from 'mongoose';
import Fastify from 'fastify';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';
import { registerOrgSettingsRoutes } from '../src/modules/org-settings/org-settings.routes.js';
import { registerOrganizationDocumentRoutes } from '../src/modules/organization-documents/organization-document.routes.js';
import { registerNotificationRoutes } from '../src/modules/notifications/notification.routes.js';
import { createNotificationModels } from '../src/modules/notifications/notification.models.js';
import { createNotificationService } from '../src/modules/notifications/notification.service.js';
import { createOrgSettingsModels } from '../src/modules/org-settings/org-settings.models.js';
import { createOrgSettingsService } from '../src/modules/org-settings/org-settings.service.js';
import { createOrganizationDocumentModels } from '../src/modules/organization-documents/organization-document.models.js';
import { createOrganizationDocumentService } from '../src/modules/organization-documents/organization-document.service.js';
import { errorHandler, httpError } from '../src/plugins/errors.js';

const legacyRequire=createRequire(new URL('../../../hrms/back-end/package.json',import.meta.url));
const userId='507f1f77bcf86cd799439011',organizationId='507f1f77bcf86cd799439012',documentId='507f1f77bcf86cd799439013',notificationId='507f1f77bcf86cd799439014';
const identity={userId,organizationId,activeOrganizationId:organizationId,activeRoleId:'superadmin',roleKey:'superadmin'};
const failure=(code,message,error=null)=>({success:false,code,message,data:null,error});
const settingsBody={leaveCreditFrequency:'monthly',leaveTypeCreditMode:'current_month_onwards',timezone:'Asia/Kolkata',minWorkHoursPerDay:8,minHalfDayHours:4};
const uploadBody={documentKey:'COMPANY_PAN',documentNumber:'PAN-1',remarks:'fixture',file:{fileName:'company.pdf',mimeType:'application/pdf',size:5,base64Data:'cGRm'} };
const idPath=`/${documentId}`;

const bodyOf=async response=>{const text=await response.text();return {status:response.status,headers:response.headers,body:response.headers.get('content-type')?.startsWith('application/json')?JSON.parse(text):text};};
const fastifyBody=response=>({status:response.statusCode,headers:response.headers,body:response.body&&response.headers['content-type']?.startsWith('application/json')?response.json():response.body});
const normalize=value=>JSON.parse(JSON.stringify(value,(key,item)=>key==='_id'&&item?'<id>':['createdAt','updatedAt','readAt','uploadedAt'].includes(key)&&item?'<timestamp>':item));
const compare=async(a,b)=>{
  assert.equal(a.status,b.status);
  const contentType=value=>typeof value?.get==='function'?value.get('content-type'):value?.['content-type'];
  assert.equal(contentType(a.headers)?.split(';')[0],contentType(b.headers)?.split(';')[0]);
  const header=(value,name)=>typeof value?.get==='function'?value.get(name):value?.[name];
  for(const name of ['cache-control','content-disposition'])assert.equal(header(a.headers,name)??null,header(b.headers,name)??null,`${name} header parity`);
  if(a.status===200&&typeof a.body==='string')assert.equal(a.body,b.body);
  else assert.deepEqual(normalize(a.body),normalize(b.body));
};

test('V1/V2 settings, document, and notification routes match status/body/headers with isolated Mongo and injected providers',async t=>{
  const suffix=randomBytes(6).toString('hex'),dbName=`hrms_support_parity_${process.pid}_${suffix}`,uri=`mongodb://127.0.0.1:27017/${dbName}`;
  const connection=await mongoose.createConnection(uri,{serverSelectionTimeoutMS:1800,autoIndex:false,autoCreate:false}).asPromise().catch(()=>null);
  if(!connection){t.skip('isolated localhost MongoDB is unavailable');return;}
  const legacyMongoose=legacyRequire('mongoose');
  await legacyMongoose.connect(uri,{serverSelectionTimeoutMS:1800,autoIndex:false,autoCreate:false});
  t.after(async()=>{await connection.dropDatabase();await connection.close();await legacyMongoose.disconnect();});

  const legacySecret=`parity-${randomBytes(16).toString('hex')}`,previousSecret=process.env.JWT_SECRET;
  process.env.JWT_SECRET=legacySecret;
  t.after(()=>{if(previousSecret===undefined)delete process.env.JWT_SECRET;else process.env.JWT_SECRET=previousSecret;});
  const jwt=legacyRequire('jsonwebtoken'),fcmToken=jwt.sign({userId,organizationId,roleKey:'superadmin'},legacySecret);
  const v1Models={
    User:legacyRequire('./src/modules/users/user.model.js'),Organization:legacyRequire('./src/modules/organizations/organization.model.js'),
    Membership:legacyRequire('./src/modules/organizations/org-user.model.js'),Role:legacyRequire('./src/modules/roles/role.model.js'),
    Permission:legacyRequire('./src/modules/permissions/permission.model.js'),OrgSettings:legacyRequire('./src/modules/orgSettings/orgSettings.model.js'),
    OrganizationDocument:legacyRequire('./src/modules/organizationDocuments/organizationDocument.model.js'),Notification:legacyRequire('./src/modules/notifications/notification.model.js'),
  };
  const secondUserId='507f1f77bcf86cd799439015';
  const secondOrganizationId='507f1f77bcf86cd799439016';
  await v1Models.User.collection.insertMany([
    {_id:new legacyMongoose.Types.ObjectId(userId),email:'parity@example.test',password:'x',status:'active',pushTokens:[]},
    {_id:new legacyMongoose.Types.ObjectId(secondUserId),email:'parity-second@example.test',password:'x',status:'active',organizationIds:[new legacyMongoose.Types.ObjectId(secondOrganizationId)],activeOrganizationId:new legacyMongoose.Types.ObjectId(secondOrganizationId),pushTokens:[]},
  ]);
  const notificationModels=createNotificationModels(connection);
  const settingsModels=createOrgSettingsModels(connection);
  const documentModels=createOrganizationDocumentModels(connection);
  await settingsModels.Organization.create({_id:organizationId,name:'Parity Co',code:'PARITY',timezone:'Asia/Kolkata',currency:'INR'});
  const seedDocument=()=>documentModels.OrganizationDocument.create({_id:documentId,organizationId,documentCategory:'REGISTRATION',documentKey:'COMPANY_PAN',documentName:'Company PAN',documentNumber:'PAN-1',filePath:'https://assets.invalid/pan.pdf',publicId:'pan-asset',resourceType:'raw',fileType:'application/pdf',fileName:'company.pdf',fileSize:5,uploadedBy:userId,expiryDate:null,status:'ACTIVE',remarks:'fixture',isDeleted:false,uploadHistory:[]});
  await seedDocument();
  await notificationModels.Notification.create({_id:notificationId,organizationId,recipientUserId:userId,title:'Fixture notice',message:'Review this',type:'general',isRead:false});
  await notificationModels.Notification.create({organizationId,recipientUserId:userId,title:'Second fixture notice',message:'Review this too',type:'general',isRead:true,createdAt:new Date(Date.now()+1000)});
  await notificationModels.Notification.create({organizationId:new mongoose.Types.ObjectId(),recipientUserId:userId,title:'Other organization notice',message:'Must stay scoped out',type:'general',isRead:false});

  const denied=(req,res,next)=>req.headers['x-test-deny']?res.status(403).json(failure(403,'Permission denied')):next();
  const legacy=createLegacyRouterHarness({identity,overrides:{
    'src/middlewares/authorize.middleware.js':()=>denied,
    'src/modules/users/user.model.js':v1Models.User,
    'src/modules/organizations/organization.model.js':v1Models.Organization,
    'src/modules/organizations/org-user.model.js':v1Models.Membership,
    'src/modules/roles/role.model.js':v1Models.Role,
    'src/modules/permissions/permission.model.js':v1Models.Permission,
    'src/modules/orgSettings/orgSettings.model.js':v1Models.OrgSettings,
    'src/modules/organizationDocuments/organizationDocument.model.js':v1Models.OrganizationDocument,
    'src/modules/notifications/notification.model.js':v1Models.Notification,
    'src/config/cloudinary.js':{uploadDataUri:async()=>({secure_url:'https://assets.invalid/pan.pdf',public_id:'pan-asset',resource_type:'raw'}),buildAuthenticatedUrl:()=> 'https://provider.invalid/private.pdf',deleteAsset:async()=>({result:'ok'})},
    'src/modules/payroll/payrollProvisioning.service.js':{ensurePayrollTenantAndDefaults:async()=>{}},
  },mounts:[
    {path:'/api/v1/org-settings',modulePath:'src/modules/orgSettings/orgSettings.routes.js'},
    {path:'/api/v1/organization-documents',modulePath:'src/modules/organizationDocuments/organizationDocuments.routes.js'},
    {path:'/api/v1/notifications',modulePath:'src/modules/notifications/notification.routes.js'},
  ]});
  const fcm=legacyRequire('./src/integrations/fcm/index.js');
  fcm.mount(legacy,'/api/v1');
  legacy.use(legacyRequire('./src/middlewares/error.middleware.js'));
  const legacyServer=createServer(legacy);
  await new Promise((resolve,reject)=>legacyServer.once('error',reject).listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>legacyServer.close(resolve)));
  const legacyUrl=`http://127.0.0.1:${legacyServer.address().port}`;

  const notificationService=createNotificationService(notificationModels);
  const v2Notifications=notificationService;
  const settingsService=createOrgSettingsService(settingsModels,{uploadDataUri:async()=>({secure_url:'https://assets.invalid/logo.png'}),ensurePayrollTenantAndDefaults:async()=>{}});
  let documentFetch=async()=>new Response('pdf-body',{status:200,headers:{'content-type':'application/pdf'}});
  const v2DocumentService=createOrganizationDocumentService({models:{...documentModels,...notificationModels},cloudinary:{uploadDataUri:async()=>({secure_url:'https://assets.invalid/pan.pdf',public_id:'pan-asset',resource_type:'raw'}),buildAuthenticatedUrl:()=> 'https://provider.invalid/private.pdf',deleteAsset:async()=>({result:'ok'})},fetchImpl:(...args)=>documentFetch(...args)});
  const docService={catalog:v2DocumentService.catalog,summary:v2DocumentService.summary,missing:v2DocumentService.missing,expiringSoon:v2DocumentService.expiringSoon,list:v2DocumentService.list,upload:v2DocumentService.upload,updateMetadata:v2DocumentService.updateMetadata,access:v2DocumentService.access,streamAccess:v2DocumentService.streamAccess,delete:v2DocumentService.delete};
  const v2=Fastify({logger:false});v2.setErrorHandler(errorHandler);
  const authorize=async(_permission,request)=>request.headers['x-test-deny']?{code:403,message:'Permission denied'}:null;
  await registerOrgSettingsRoutes(v2,{service:settingsService,authenticate:async request=>{request.user=identity;},authorize});
  let providerCalls=0;
  await registerOrganizationDocumentRoutes(v2,{service:docService,authenticate:async request=>{request.user=identity;},authorize,fetchImpl:async()=>{providerCalls++;return new Response('pdf-body',{status:200,headers:{'content-type':'application/pdf'}});}});
  await registerNotificationRoutes(v2,{service:v2Notifications,authenticate:async request=>{
    const token=request.headers.authorization?.replace(/^Bearer\s+/i,'');
    request.user=token?jwt.verify(token,legacySecret):identity;
  },authorize});
  await v2.ready();t.after(()=>v2.close());

  const https=legacyRequire('https'),originalHttpsGet=https.get;
  https.get=(_url,callback)=>{const request=new EventEmitter();queueMicrotask(()=>{const remote=new PassThrough();remote.statusCode=200;remote.headers={'content-type':'application/pdf'};callback(remote);remote.end('pdf-body');});return request;};
  t.after(()=>{https.get=originalHttpsGet;});
  const cases=[
    ['GET','/api/v1/org-settings/','/api/v2/org-settings/',undefined],
    ['POST','/api/v1/org-settings/','/api/v2/org-settings/',settingsBody],
    ['GET','/api/v1/org-settings/theme','/api/v2/org-settings/theme',undefined],
    ['POST','/api/v1/org-settings/theme','/api/v2/org-settings/theme',{themeMode:'preset',themePreset:'ocean',themeConfig:{}}],
    ['GET','/api/v1/organization-documents/catalog?esicApplicable=false','/api/v2/organization-documents/catalog?esicApplicable=false',undefined],
    ['GET','/api/v1/organization-documents/summary?days=14','/api/v2/organization-documents/summary?days=14',undefined],
    ['GET','/api/v1/organization-documents/reports/missing','/api/v2/organization-documents/reports/missing',undefined],
    ['GET','/api/v1/organization-documents/reports/expiring-soon?days=14','/api/v2/organization-documents/reports/expiring-soon?days=14',undefined],
    ['GET','/api/v1/organization-documents/?includeHistory=true','/api/v2/organization-documents/?includeHistory=true',undefined],
    ['POST','/api/v1/organization-documents/upload','/api/v2/organization-documents/upload',uploadBody],
    ['PATCH',`/api/v1/organization-documents${idPath}`,`/api/v2/organization-documents${idPath}`,{remarks:'updated'}],
    ['GET',`/api/v1/organization-documents${idPath}/access`,`/api/v2/organization-documents${idPath}/access`,undefined],
    ['GET',`/api/v1/organization-documents${idPath}/preview`,`/api/v2/organization-documents${idPath}/preview`,undefined],
    ['GET',`/api/v1/organization-documents${idPath}/download`,`/api/v2/organization-documents${idPath}/download`,undefined],
    ['DELETE',`/api/v1/organization-documents${idPath}`,`/api/v2/organization-documents${idPath}`,undefined],
    ['GET','/api/v1/notifications/my?page=1&limit=10&onlyUnread=true','/api/v2/notifications/my?page=1&limit=10&onlyUnread=true',undefined],
    ['GET','/api/v1/notifications/my?page=1&limit=1','/api/v2/notifications/my?page=1&limit=1',undefined],
    ['GET','/api/v1/notifications/unread-count','/api/v2/notifications/unread-count',undefined],
    ['PATCH',`/api/v1/notifications/${notificationId}/read`,`/api/v2/notifications/${notificationId}/read`,undefined],
    ['PATCH','/api/v1/notifications/read-all','/api/v2/notifications/read-all',undefined],
    ['POST','/api/v1/notifications/device-token/register','/api/v2/notifications/device-token/register',{token:'fcm-device-1',platform:'android'},true],
    ['POST','/api/v1/notifications/device-token/unregister','/api/v2/notifications/device-token/unregister',{token:'fcm-device-1'},true],
  ];
  for(const [method,v1url,v2url,payload,isFcm] of cases){
    const legacyHeaders={'content-type':'application/json'};
    if(isFcm)legacyHeaders.authorization=`Bearer ${fcmToken}`;
    const a=await bodyOf(await fetch(`${legacyUrl}${v1url}`,{method,headers:legacyHeaders,...(payload?{body:JSON.stringify(payload)}:{})}));
    if(v1url.endsWith('/upload')||method==='DELETE'){
      await documentModels.OrganizationDocument.deleteMany({organizationId});
      await seedDocument();
    }
    const b=fastifyBody(await v2.inject({method,url:v2url,...(payload?{payload}:{})}));
    await compare(a,b);
  }
  assert.equal(providerCalls,2,'V2 stream provider is called for preview and download');

  for(const outcome of [
    {status:404,body:'missing'},
    {status:503,body:'temporarily unavailable'},
    {error:new Error('connection reset')},
  ]){
    https.get=(_url,callback)=>{
      const remote=new PassThrough();
      remote.statusCode=outcome.status||200;
      remote.headers={'content-type':'application/pdf'};
      process.nextTick(()=>{
        if(outcome.error){remote.emit('error',outcome.error);return;}
        callback(remote);
        if(outcome.status>=400)remote.end(outcome.body);
        else remote.end('pdf-body');
      });
      return remote;
    };
    const failingFetch=async()=>outcome.error?Promise.reject(outcome.error):new Response(outcome.body,{status:outcome.status,headers:{'content-type':'application/pdf'}});
    documentFetch=failingFetch;
    const operations=outcome.error?['preview','download']:['preview','download'];
    for(const operation of operations){
      const a=await bodyOf(await fetch(`${legacyUrl}/api/v1/organization-documents${idPath}/${operation}`));
      const b=fastifyBody(await v2.inject({method:'GET',url:`/api/v2/organization-documents${idPath}/${operation}`}));
      await compare(a,b);
    }
  }
  https.get=originalHttpsGet;

  for(const [v1url,v2url,payload] of [
    ['/api/v1/org-settings/','/api/v2/org-settings/',{...settingsBody,leaveCreditFrequency:'weekly'}],
    ['/api/v1/organization-documents/upload','/api/v2/organization-documents/upload',{...uploadBody,file:{...uploadBody.file,mimeType:'application/x-exe'}}],
  ]){
    const a=await bodyOf(await fetch(`${legacyUrl}${v1url}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}));
    const b=fastifyBody(await v2.inject({method:'POST',url:v2url,payload}));
    await compare(a,b);
  }
  const deniedA=await bodyOf(await fetch(`${legacyUrl}/api/v1/org-settings/`,{headers:{'x-test-deny':'1'}}));
  const deniedB=fastifyBody(await v2.inject({method:'GET',url:'/api/v2/org-settings/',headers:{'x-test-deny':'1'}}));
  await compare(deniedA,deniedB);
  for(const [v1url,v2url] of [['/api/v1/organization-documents/','/api/v2/organization-documents/'],['/api/v1/notifications/my','/api/v2/notifications/my']]){
    const a=await bodyOf(await fetch(`${legacyUrl}${v1url}`,{headers:{'x-test-deny':'1'}}));
    const b=fastifyBody(await v2.inject({method:'GET',url:v2url,headers:{'x-test-deny':'1'}}));
    await compare(a,b);
  }
  const emptyTokenA=await bodyOf(await fetch(`${legacyUrl}/api/v1/notifications/device-token/register`,{method:'POST',headers:{authorization:`Bearer ${fcmToken}`,'content-type':'application/json'},body:JSON.stringify({token:'  '})}));
  const emptyTokenB=fastifyBody(await v2.inject({method:'POST',url:'/api/v2/notifications/device-token/register',payload:{token:'  '}}));
  await compare(emptyTokenA,emptyTokenB);
  const registerToken=async({actingUserId,token,platform})=>{
    const actingToken=jwt.sign({userId:actingUserId,organizationId:actingUserId===secondUserId?secondOrganizationId:organizationId,roleKey:'superadmin'},legacySecret);
    const left=await bodyOf(await fetch(`${legacyUrl}/api/v1/notifications/device-token/register`,{method:'POST',headers:{authorization:`Bearer ${actingToken}`,'content-type':'application/json'},body:JSON.stringify({token,platform})}));
    const right=fastifyBody(await v2.inject({method:'POST',url:'/api/v2/notifications/device-token/register',headers:{authorization:`Bearer ${actingToken}`},payload:{token,platform}}));
    await compare(left,right);
    const [v1Users,v2Users]=await Promise.all([
      v1Models.User.find({_id:{$in:[userId,secondUserId]}}).lean(),
      notificationModels.User.find({_id:{$in:[userId,secondUserId]}}).lean(),
    ]);
    const project=users=>Object.fromEntries(users.map(user=>[String(user._id),user.pushTokens.map(item=>({token:item.token,platform:item.platform}))]));
    assert.deepEqual(project(v2Users),project(v1Users),'device token ownership and platform match');
  };
  await registerToken({actingUserId:userId,token:'ownership-transfer-token',platform:'android'});
  await registerToken({actingUserId:userId,token:'ownership-transfer-token',platform:'ios'});
  await registerToken({actingUserId:secondUserId,token:'ownership-transfer-token',platform:'android'});
  const afterTransfer=await notificationModels.User.find({_id:{$in:[userId,secondUserId]}}).lean();
  assert.deepEqual(afterTransfer.find(user=>String(user._id)===userId).pushTokens.map(item=>item.token),[],'previous owner loses reassigned device token');
  assert.deepEqual(afterTransfer.find(user=>String(user._id)===secondUserId).pushTokens.map(item=>item.token),['ownership-transfer-token'],'new owner receives device token');
  const tokenUser=await notificationModels.User.findById(userId).lean();
  assert.deepEqual(tokenUser.pushTokens.map(item=>item.token),[],'unregister removes the device token');
});
