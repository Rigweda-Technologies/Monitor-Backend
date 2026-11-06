import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentService } from '../src/modules/agents/agent.service.js';

const models = { User:{}, Employee:{ findOne: () => ({ select: () => ({ lean: async () => ({ _id:'e1', firstName:'A', lastName:'B', employeeCode:'E1' }) }) }) } };
const repo = () => ({
  getCloudinarySettings: async () => ({ cloudName:'c', apiKey:'k', apiSecretMasked:'abc******xyz', screenshotsEnabled:true }),
  getRawCloudinarySettings: async () => ({ cloudName:'c', apiKey:'k', apiSecret:'secret', uploadFolderRoot:'root' }),
  getUsbControlConfig: async () => ({ usbEnabled:false }),
  saveCloudinarySettings: async (_org,payload) => ({ cloudName:payload.cloudName, apiSecretMasked:'******', updatedAt:'now' }),
});

test('Cloudinary settings keep secret out of upload config and retain documented defaults', async () => {
  const monitorRepository = repo();
  const service = createAgentService({ models, monitorRepository, cloudinary:{ testSettings:async()=>{}, createSignedUploadPayload:()=>({ params:{} }), verifyScreenshotAsset:async()=>({}) } });
  const config = await service.getCloudinaryUploadConfig({ user:{ organizationId:'org1' } });
  assert.equal(config.cloudName, 'c');
  assert.equal('apiSecretMasked' in config, false);
  const saved = await service.saveCloudinarySettings({ user:{ organizationId:'org1' }, body:{ cloudName:' c ',apiKey:' k ' } });
  assert.equal(saved.cloudName, 'c');
  assert.equal(monitorRepository.saveCloudinarySettings ? true : false, true);
});

test('upload session scopes writes to authenticated org and employee and preserves provider failures', async () => {
  const calls = [];
  const monitorRepository = { ...repo(), createOrUpdateScreenshotBatch:async batch => { calls.push(batch); return true; }, findUploadedScreenshotByHash:async () => null, upsertPendingScreenshot:async item => { calls.push(item); return true; } };
  const expectedFailure = Object.assign(new Error('provider unavailable'), { code:503 });
  const service = createAgentService({ models, monitorRepository, now:()=>1_000_000, randomUUID:()=> 'id1', cloudinary:{ testSettings:async()=>{}, createSignedUploadPayload:()=>{ throw expectedFailure; }, verifyScreenshotAsset:async()=>({}) } });
  await assert.rejects(service.createUploadSession({ user:{ userId:'u1', organizationId:'org1' }, body:{ batchId:'b1',deviceId:'d1',screenshots:[{ clientScreenshotId:'s1',capturedAt:'2026-01-01T00:00:00Z',originalFileName:'x.png',mimeType:'image/png',sha256:'a'.repeat(64),sizeBytes:50 }] } }), error => error === expectedFailure);
  assert.equal(calls[0].organizationId, 'org1');
  assert.equal(calls[0].employeeId, 'e1');
  assert.equal(calls[1].deviceId, 'd1');
});

test('upload session response preserves signed and duplicate upload item shapes', async () => {
  const monitorRepository={ ...repo(),createOrUpdateScreenshotBatch:async()=>true,findUploadedScreenshotByHash:async()=>({id:'prior1',cloudinary_url:'https://duplicate.example/prior'}),upsertPendingScreenshot:async()=>true };
  const service=createAgentService({models,monitorRepository,now:()=>5000,randomUUID:()=> 'new1',cloudinary:{testSettings:async()=>{},createSignedUploadPayload:args=>({cloudName:args.settings.cloudName,apiKey:args.settings.apiKey,uploadUrl:'https://api.cloudinary.com/upload',params:{folder:args.folder,public_id:args.publicId,timestamp:args.timestamp,type:'authenticated',signature:'sig'}}),verifyScreenshotAsset:async()=>({})}});
  const data=await service.createUploadSession({user:{userId:'u1',organizationId:'org1'},body:{batchId:'b1',deviceId:'d1',screenshots:[{clientScreenshotId:'s1',capturedAt:'2026-11-01T00:00:00Z',originalFileName:'x.png',mimeType:'image/png',sha256:'a'.repeat(64),sizeBytes:10}]}});
  assert.deepEqual(data,{batchId:'b1',employeeId:'e1',deviceId:'d1',expiresInSeconds:300,uploads:[{clientScreenshotId:'s1',status:'duplicate',duplicateOf:'prior1',cloudinaryUrl:'https://duplicate.example/prior'}]});
});

test('completion preserves repository payload and ownership errors', async () => {
  const result={id:'b1',organization_id:'org1',status:'complete',acknowledgedScreenshotIds:['s1']};
  let input;
  const monitorRepository={...repo(),completeScreenshotBatch:async args=>{input=args;return result;}};
  const service=createAgentService({models,monitorRepository,cloudinary:{testSettings:async()=>{},createSignedUploadPayload:()=>({}),verifyScreenshotAsset:async()=>({})}});
  assert.equal(await service.completeUploadSession({user:{userId:'u1',organizationId:'org1'},params:{batchId:'b1'},body:{deviceId:'d1'}}),result);
  assert.equal(input.organizationId,'org1'); assert.equal(input.employeeId,'e1'); assert.deepEqual(input.uploaded,[]); assert.deepEqual(input.duplicates,[]);
  const denied=Object.assign(new Error('Screenshot batch or item not found for this account.'),{code:404,statusCode:404});
  monitorRepository.completeScreenshotBatch=async()=>{throw denied;};
  await assert.rejects(service.completeUploadSession({user:{userId:'u1',organizationId:'org1'},params:{batchId:'missing'},body:{deviceId:'d1'}}),error=>error===denied);
});

test('health persistence is scoped to linked employee and clamps optional metrics', async () => {
  let health;
  const service = createAgentService({ models, monitorRepository:{ ...repo(), upsertDeviceHealth:async value => { health=value; return value; } }, cloudinary:{ testSettings:async()=>{}, createSignedUploadPayload:()=>({}), verifyScreenshotAsset:async()=>({}) }, now:()=>1234 });
  await service.saveHealth({ user:{userId:'u1',organizationId:'org1'}, body:{deviceId:'d1',cpuPercent:99,temperatureC:-40,disks:[{mount:'/',usedPercent:90}] } });
  assert.equal(health.employeeId,'e1');
  assert.equal(health.cpuPercent,99);
  assert.equal(health.temperatureC,-40);
  assert.equal(health.disks[0].usedPercent,90);
});

test('screenshot listing applies org aliases, timezone filters, row projection and signed delivery URLs', async () => {
  const row = { id:'ss1', batchId:'b1', organizationId:'org1', employeeId:'e1', deviceId:'d1', capturedAt:new Date('2026-10-31T20:00:00.000Z'), cloudinaryFolder:'root/e1/2026_11_01', cloudinaryPublicId:'asset1', uploadStatus:'uploaded', processingStatus:'complete' };
  const calls = [];
  const orgSettingsModel={findOne:()=>({select:()=>({lean:async()=>({timezone:'Asia/Kolkata'})})})};
  const organizationModel={findById:()=>({select:()=>({lean:async()=>({timezone:'UTC'})})})};
  const screenshotsModel = { findOne: filter => ({ select: () => ({ lean:async()=>{ calls.push(['alias',filter]); return { _id:'e1',employeeCode:'E1',userId:'u1' }; } }) }), find:filter => ({ select: () => ({ lean:async()=>{ calls.push(['employees',filter]); return [{_id:'e1',firstName:'Ada',lastName:'Lovelace',employeeCode:'E1',userId:'u1'}]; } }) }) };
  const monitorRepository = { ...repo(), listScreenshotRows:async filters => { calls.push(['list',filters]); return { rows:[row], total:1 }; } };
  const service = createAgentService({ models:{ ...models, Employee:screenshotsModel, OrgSettings:orgSettingsModel, Organization:organizationModel }, monitorRepository, cloudinary:{ testSettings:async()=>{}, createSignedUploadPayload:()=>({}), verifyScreenshotAsset:async()=>({}), buildSignedScreenshotUrl:(_settings,_row)=>'https://signed.example/asset' } });
  const result = await service.getScreenshots({ user:{organizationId:'org1'}, query:{employeeId:'E1',date:'2026-11-01',hour:'8',onlyWithImage:'true',page:'2',limit:'50'} });
  assert.deepEqual(Object.keys(result), ['items','page','limit','count','total','timezone','source']);
  assert.equal(result.page,2); assert.equal(result.limit,50); assert.equal(result.count,1); assert.equal(result.total,1); assert.equal(result.timezone,'Asia/Kolkata');
  assert.deepEqual(result.items[0], { screenshotId:'ss1',attendanceId:null,organizationId:'org1',employeeId:'e1',employeeName:'Ada Lovelace',employeeCode:'E1',date:row.capturedAt,dateKey:'2026-11-01',action:'screenshot',capturedAt:row.capturedAt,imageUrl:'https://signed.example/asset',selfieProvided:true,deviceId:'d1',ip:null,status:'uploaded',shiftName:null,shiftCode:null,source:'monitor_db',publicId:'root/e1/2026_11_01/asset1',processingStatus:'complete' });
  const filters=calls.find(call=>call[0]==='list')[1];
  assert.deepEqual(filters.employeeIds,['e1','E1','u1']);
  assert.equal(filters.dateStart.toISOString(),'2026-10-31T18:30:00.000Z');
  assert.equal(filters.dateEnd.toISOString(),'2026-11-01T18:29:59.999Z');
  assert.deepEqual([filters.hour,filters.onlyWithImage,filters.offset,filters.limit],[8,true,50,50]);
});

test('upload signer uses per-org credentials and screenshot verifier falls back only on 404', async () => {
  const { createAgentCloudinaryAdapter } = await import('../src/modules/agents/agent.cloudinary.js');
  const calls=[];
  const fake = { utils:{api_sign_request:(params,secret)=>{ calls.push(['sign',params,secret]); return 'signature'; }}, url:(publicId,options)=>{calls.push(['url',publicId,options]);return 'signed-url';}, api:{ ping:async options=>{calls.push(['ping',options]);return{};}, resource:async(publicId,options)=>{calls.push(['resource',publicId,options]); if(calls.filter(c=>c[0]==='resource').length<=2) throw Object.assign(new Error('not found'),{http_code:404}); return {public_id:publicId,resource_type:'image',asset_id:'a1',version:2,secure_url:'https://asset.example/a1',bytes:42,format:'png'};} } };
  const adapter=createAgentCloudinaryAdapter({client:fake, sleep:async()=>{}, now:()=>123456});
  const settings={cloudName:'org-cloud',apiKey:'org-key',apiSecret:'org-secret'};
  const upload=adapter.createSignedUploadPayload({settings,folder:'root/e1/2026_11_01',publicId:'asset',timestamp:123,context:{device_id:'d1'}});
  assert.equal(upload.cloudName,'org-cloud'); assert.equal(upload.apiKey,'org-key'); assert.equal(upload.params.signature,'signature'); assert.equal(calls[0][2],'org-secret');
  await adapter.testSettings(settings);
  assert.equal(calls.find(call=>call[0]==='ping')[1].api_secret,settings.apiSecret);
  assert.equal(adapter.buildSignedScreenshotUrl(settings,{cloudinary_folder:'root/e1',cloudinary_public_id:'asset'}),'signed-url');
  assert.equal(calls.find(call=>call[0]==='url')[2].expires_at,Math.floor(123456/1000)+3600);
  const verified=await adapter.verifyScreenshotAsset({settings,row:{cloudinary_folder:'root/e1/2026_11_01',cloudinary_public_id:'asset'}});
  assert.equal(verified.cloudinaryUrl,'https://asset.example/a1'); assert.equal(calls.filter(call=>call[0]==='resource').length,3);
  const resourceCalls=calls.filter(call=>call[0]==='resource');
  assert.deepEqual(resourceCalls.map(call=>[call[1],call[2].type]),[['root/e1/2026_11_01/asset','authenticated'],['root/e1/2026_11_01/asset','upload'],['asset','authenticated']]);
  assert.equal(resourceCalls[0][2].api_secret,settings.apiSecret);
  const rejectedCalls=[];
  const non404=createAgentCloudinaryAdapter({client:{...fake,api:{resource:async()=>{rejectedCalls.push(1);throw Object.assign(new Error('provider down'),{http_code:503});}}},sleep:async()=>{}});
  await assert.rejects(non404.verifyScreenshotAsset({settings,row:{cloudinary_public_id:'asset'}}),/could not be verified/);
  assert.equal(rejectedCalls.length,1);
  const retryCalls=[]; const delays=[];
  const missing=createAgentCloudinaryAdapter({client:{...fake,api:{resource:async()=>{retryCalls.push(1);throw Object.assign(new Error('not found'),{http_code:404});}}},sleep:async ms=>delays.push(ms)});
  await assert.rejects(missing.verifyScreenshotAsset({settings,row:{cloudinary_folder:'folder',cloudinary_public_id:'asset'}}),/could not be verified/);
  assert.equal(retryCalls.length,16); assert.deepEqual(delays,[400,1000,2000]);
});
