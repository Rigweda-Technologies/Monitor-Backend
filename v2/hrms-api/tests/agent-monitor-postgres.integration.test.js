import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire, Module } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createAgentMonitorRepository } from '../src/modules/agents/agent-monitor.repository.js';
import { createActivityService } from '../src/modules/activity/activity.service.js';
import { createMonitorActivityRepository } from '../src/modules/activity/activity.repository.js';

const databaseUrl = process.env.V2_HRMS_ISOLATED_MONITOR_TEST_DATABASE_URL;
const require = createRequire(import.meta.url);
const { Client } = require('../../../hrms/back-end/node_modules/pg');
const isolatedUrl = value => {
  const parsed = new URL(value);
  assert.ok(['localhost','127.0.0.1','::1'].includes(parsed.hostname), 'monitor integration database must be local');
  assert.match(parsed.pathname, /[_-](test|isolated|ci)([_-]|$)/i, 'monitor integration database must be explicitly isolated');
  const suffix = `v2_agent_${process.pid}_${randomUUID().replaceAll('-', '')}`;
  parsed.pathname = `${parsed.pathname.replace(/\/$/,'')}_${suffix}`;
  return parsed.toString();
};

test('agent monitor repository operates on isolated PostgreSQL tables initialized with V1 schema', { skip: !databaseUrl }, async t => {
  const uri = isolatedUrl(databaseUrl);
  const legacySchemaPath = new URL('../../../desktop/backend/src/database/schema.js', import.meta.url);
  const schemaText = await (await import('node:fs/promises')).readFile(legacySchemaPath, 'utf8');
  const admin = new Client({ connectionString:databaseUrl });
  await admin.connect();
  const disposableName = new URL(uri).pathname.slice(1);
  await admin.query(`CREATE DATABASE "${disposableName.replaceAll('"','""')}"`);
  await admin.end();
  const cleanupClients = [];
  t.after(async () => {
    await Promise.all(cleanupClients.map(connection => connection.end().catch(() => {})));
    const dropper = new Client({ connectionString:databaseUrl });
    await dropper.connect();
    await dropper.query(`DROP DATABASE IF EXISTS "${disposableName.replaceAll('"','""')}" WITH (FORCE)`);
    await dropper.end();
  });
  const client = new Client({ connectionString:uri });
  await client.connect();
  await client.query('BEGIN');
  try {
    // Reproduce only the existing V1 Monitor tables needed by this repository.
    const blocks = [...schemaText.matchAll(/await pool\.query\(`([\s\S]*?)`\);/g)].map(match => match[1]);
    const required = ['monitor_screenshot_batches','monitor_screenshots','monitor_cloudinary_settings','monitor_device_health'];
    const ddl = blocks.filter(block => required.some(table => block.includes(table)));
    for (const statement of ddl) await client.query(statement);
    // HRMS V1's Cloudinary adapter adds only these three settings columns.
    await client.query('ALTER TABLE monitor_cloudinary_settings ADD COLUMN IF NOT EXISTS screenshots_enabled BOOLEAN NOT NULL DEFAULT TRUE, ADD COLUMN IF NOT EXISTS mouse_enabled BOOLEAN NOT NULL DEFAULT TRUE, ADD COLUMN IF NOT EXISTS keyboard_enabled BOOLEAN NOT NULL DEFAULT TRUE');
    await client.query('ALTER TABLE monitor_device_health ADD COLUMN IF NOT EXISTS employee_code TEXT');
    await client.query('ALTER TABLE monitor_device_health ADD COLUMN IF NOT EXISTS cpu_core_count INTEGER');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    await client.end();
    throw error;
  }
  await client.end();
  // Connect to the disposable database through Prisma's raw-query surface.
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const { PrismaClient } = await import('../generated/monitor-client/index.js');
  const prisma = new PrismaClient({ adapter:new PrismaPg({ connectionString:uri, max:2 }) });
  t.after(() => prisma.$disconnect());
  const repository = createAgentMonitorRepository({ prisma, encryptionSecret:'isolated-monitor-test-key' });
  const organizationId = `org-${randomUUID()}`;
  const employeeId = `employee-${randomUUID()}`;
  const deviceId = `device-${randomUUID()}`;
  const batchId = `batch-${randomUUID()}`;

  const saved = await repository.saveCloudinarySettings(organizationId, { cloudName:'test-cloud',apiKey:'test-key',apiSecret:'test-secret' });
  assert.equal(saved.cloudName,'test-cloud');
  assert.equal(saved.appUsageEnabled,true);
  assert.equal(saved.browserHistoryEnabled,false);
  assert.equal(saved.screenshotIntervalMinutes,1);
  assert.equal((await repository.getRawCloudinarySettings(organizationId)).apiSecret,'test-secret');
  assert.equal((await repository.getUsbControlConfig(organizationId)).usbEnabled,true);

  assert.equal(await repository.createOrUpdateScreenshotBatch({ batchId,organizationId,employeeId,deviceId,expectedCount:1,expectedBytes:12,firstCapturedAt:new Date('2026-10-31T10:00:00Z'),lastCapturedAt:new Date('2026-10-31T10:00:00Z') }),true);
  assert.equal(await repository.upsertPendingScreenshot({ id:randomUUID(),batchId,organizationId,employeeId,deviceId,item:{clientScreenshotId:'screen-1',capturedAt:new Date('2026-10-31T10:00:00Z'),originalFileName:'screen.png',mimeType:'image/png',sha256:'a'.repeat(64),sizeBytes:12},folder:'root',publicId:'screen-1' }),true);
  await assert.rejects(repository.completeScreenshotBatch({batchId,organizationId,employeeId,deviceId,uploaded:[{clientScreenshotId:'screen-1',cloudinaryPublicId:'screen-1',cloudinaryUrl:'https://assets.invalid/screen.png'}],verifyAsset:async()=>{throw new Error('provider verification unavailable');}}),/provider verification unavailable/);
  const failedVerificationRows=await prisma.$queryRawUnsafe(`SELECT b.status AS batch_status,s.upload_status FROM monitor_screenshot_batches b JOIN monitor_screenshots s ON s.batch_id=b.id WHERE b.id=$1`,batchId);
  assert.deepEqual(failedVerificationRows.map(({batch_status,upload_status})=>({batch_status,upload_status})),[{batch_status:'pending',upload_status:'pending'}],'failed provider verification rolls completion writes back');
  const completed = await repository.completeScreenshotBatch({ batchId,organizationId,employeeId,deviceId,uploaded:[{clientScreenshotId:'screen-1',cloudinaryPublicId:'screen-1',cloudinaryUrl:'https://assets.invalid/screen.png'}],verifyAsset:async row=>({cloudinaryUrl:'https://assets.invalid/screen.png',cloudinaryPublicId:row.cloudinary_public_id}) });
  assert.equal(completed.status,'complete');
  const listed = await repository.listScreenshotRows({organizationId,employeeIds:[employeeId],dateStart:new Date('2026-10-31T00:00:00Z'),dateEnd:new Date('2026-11-01T00:00:00Z'),hour:null,timezone:'Asia/Kolkata',onlyWithImage:true,page:1,limit:10,offset:0});
  assert.equal(listed.total,1);
  assert.equal(listed.rows[0].upload_status,'uploaded');

  const health = await repository.upsertDeviceHealth({organizationId,employeeId,employeeName:'Test Employee',employeeCode:'E-1',deviceId,hostname:'test-host',platform:'macOS',reportedAt:new Date('2026-10-31T10:00:00Z'),lastSeenAt:new Date('2026-10-31T10:00:00Z'),disks:[]});
  assert.equal(health.deviceId,deviceId);
  assert.equal(health.employee.code,'E-1');

  await prisma.$executeRawUnsafe(`ALTER TABLE monitor_cloudinary_settings
    ADD COLUMN app_usage_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN browser_history_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN usb_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN screenshot_interval_minutes INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN mouse_heartbeat_minutes INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN mouse_idle_threshold_minutes INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN keyboard_heartbeat_minutes INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN app_usage_heartbeat_minutes INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN browser_history_sync_minutes INTEGER NOT NULL DEFAULT 1`);
  const expanded = await repository.saveCloudinarySettings(organizationId,{cloudName:'test-cloud',apiKey:'test-key',screenshotsEnabled:false,appUsageEnabled:false,browserHistoryEnabled:true,usbEnabled:false,screenshotIntervalMinutes:5,apiSecret:''});
  assert.equal(expanded.appUsageEnabled,false);
  assert.equal(expanded.browserHistoryEnabled,true);
  assert.equal(expanded.usbEnabled,false);
  assert.equal(expanded.screenshotIntervalMinutes,5);
  assert.equal((await repository.getUsbControlConfig(organizationId)).usbEnabled,false);

  const healthSnapshotAt = (minutesAgo, device) => repository.upsertDeviceHealth({
    organizationId,employeeId,employeeName:'Test Employee',employeeCode:'E-1',deviceId:device,
    hostname:device,platform:'macOS',reportedAt:new Date(Date.now()-minutesAgo*60_000),
    lastSeenAt:new Date(Date.now()-minutesAgo*60_000),disks:[],
  });
  await healthSnapshotAt(20,`${deviceId}-older`);
  await healthSnapshotAt(5,`${deviceId}-newer`);
  await repository.upsertDeviceHealth({organizationId,employeeId:`${employeeId}-2`,employeeName:'Second Employee',employeeCode:'E-2',deviceId:`${deviceId}-other`,hostname:'other-host',platform:'Windows',reportedAt:new Date(),lastSeenAt:new Date(),disks:[]});

  const v1PackageUrl = new URL('../../../hrms/back-end/package.json',import.meta.url);
  const v1Require = createRequire(v1PackageUrl);
  const employeeModelPath = fileURLToPath(new URL('../../../hrms/back-end/src/modules/employees/employee.model.js',import.meta.url));
  const monitorDbPath = fileURLToPath(new URL('../../../hrms/back-end/src/config/monitorDb.js',import.meta.url));
  const pool = { query:(...args)=>clientForV1Health.query(...args) };
  const clientForV1Health = new Client({ connectionString:uri });
  await clientForV1Health.connect();
  cleanupClients.push(clientForV1Health);
  const originalLoad = Module._load;
  Module._load = function(request,parent,isMain) {
    let resolved;
    try { resolved=Module._resolveFilename(request,parent,isMain); } catch {}
    if(resolved===employeeModelPath)return {};
    if(resolved===monitorDbPath)return {getMonitorPgPool:async()=>pool};
    return originalLoad.apply(this,arguments);
  };
  let v1Health;
  try { v1Health=v1Require('./src/modules/agent/agent.health.service.js'); }
  finally { Module._load=originalLoad; }
  const [v1HealthRows,v2HealthRows] = await Promise.all([
    v1Health.listHealth({organizationId}),
    createActivityService({models:{},repository:createMonitorActivityRepository({prisma})}).listLaptopHealth({organizationId}),
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(v2HealthRows)),JSON.parse(JSON.stringify(v1HealthRows)));
  assert.equal(v1HealthRows.length,2,'V1 groups multiple device snapshots to one latest row per employee');
  assert.equal(v1HealthRows.find(row=>row.employeeId===employeeId).deviceId,`${deviceId}-newer`);
});
