import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentMonitorRepository } from '../src/modules/agents/agent-monitor.repository.js';

test('Cloudinary monitor settings use encrypted persisted values and preserve decrypted v1 settings', async () => {
  let row;
  const calls = [];
  const prisma = { $queryRawUnsafe: async (sql, ...values) => {
    calls.push({ sql, values });
    if (sql.includes('information_schema.columns')) return ['organization_id','cloud_name','api_key','api_secret_ciphertext','api_secret_iv','api_secret_auth_tag','upload_folder_root','screenshots_enabled','mouse_enabled','keyboard_enabled','app_usage_enabled','browser_history_enabled','usb_enabled','screenshot_interval_minutes','mouse_heartbeat_minutes','mouse_idle_threshold_minutes','keyboard_heartbeat_minutes','app_usage_heartbeat_minutes','browser_history_sync_minutes'].map(column_name=>({column_name}));
    if (sql.includes('INSERT INTO monitor_cloudinary_settings')) {
      row = { organization_id: values[0], cloud_name: values[1], api_key: values[2], api_secret_ciphertext: values[3], api_secret_iv: values[4], api_secret_auth_tag: values[5], upload_folder_root: values[6], screenshots_enabled: values[7], mouse_enabled: values[8], keyboard_enabled: values[9], app_usage_enabled: values[10], browser_history_enabled: values[11], usb_enabled: values[12], screenshot_interval_minutes: values[13], mouse_heartbeat_minutes: values[14], mouse_idle_threshold_minutes: values[15], keyboard_heartbeat_minutes: values[16], app_usage_heartbeat_minutes: values[17], browser_history_sync_minutes: values[18], updated_at: new Date('2026-01-01T00:00:00Z') };
      return [row];
    }
    return row ? [row] : [];
  } };
  const repository = createAgentMonitorRepository({ prisma, encryptionSecret:'synthetic-test-key', now:()=>new Date('2026-01-01T00:00:00Z') });

  await repository.saveCloudinarySettings('org1', { cloudName:'cloud', apiKey:'key', apiSecret:'secret', uploadFolderRoot:'root' });
  const persistedSecret = row.api_secret_ciphertext;
  assert.notEqual(persistedSecret, 'secret');
  const write = calls.find(call => call.sql.includes('INSERT INTO monitor_cloudinary_settings'));
  assert.ok(write.sql.includes('ON CONFLICT (organization_id)'));
  assert.equal(write.values[0], 'org1');
  assert.equal((await repository.getRawCloudinarySettings('org1')).apiSecret, 'secret');
  assert.equal((await repository.getCloudinarySettings('org1')).apiSecretMasked, '******');
});

test('screenshot batch creation refuses identifiers owned by another tenant', async () => {
  const prisma = { $queryRawUnsafe: async sql => sql.includes('INSERT INTO monitor_screenshot_batches') ? [] : [{ organization_id:'other-org', employee_id:'other-employee' }] };
  const repository = createAgentMonitorRepository({ prisma });
  assert.equal(await repository.createOrUpdateScreenshotBatch({ batchId:'batch', organizationId:'org1', employeeId:'employee', deviceId:'device', expectedCount:1, expectedBytes:12 }), false);
});

test('health upsert uses Prisma parameter bindings for input values', async () => {
  let call;
  const prisma = { $queryRawUnsafe: async (sql, ...values) => { call={sql,values}; return [{ id:1n, ...Object.fromEntries([]) }]; } };
  const repository = createAgentMonitorRepository({ prisma });
  await repository.upsertDeviceHealth({ organizationId:'org1', employeeId:'employee', deviceId:'device', employeeName:'A', employeeCode:'E1', reportedAt:new Date(), lastSeenAt:new Date(), disks:[] });
  assert.match(call.sql, /ON CONFLICT \(organization_id,device_id\) DO UPDATE/);
  assert.ok(call.values.includes('org1'));
  assert.ok(!call.sql.includes('org1'));
});

test('screenshot search binds tenant, aliases, timezone and pagination while preserving counts', async () => {
  const calls=[];
  const prisma={ $queryRawUnsafe:async(sql,...values)=>{calls.push({sql,values});return sql.includes('COUNT(*)')?[{total:3}]:[{id:'s1',employee_id:'e1',captured_at:new Date()}];} };
  const repository=createAgentMonitorRepository({prisma});
  const result=await repository.listScreenshotRows({organizationId:'org',employeeIds:['e1','E-1'],dateStart:new Date('2026-01-01T00:00:00Z'),dateEnd:new Date('2026-01-01T23:59:59Z'),hour:9,timezone:'Asia/Kolkata',onlyWithImage:true,page:2,limit:10,offset:10});
  assert.equal(result.total,3);
  assert.equal(result.rows[0].employee_id,'e1');
  assert.equal(calls.length,2);
  assert.ok(calls[1].sql.includes('captured_at AT TIME ZONE'));
  assert.match(calls[1].sql,/ORDER BY captured_at DESC,\s*created_at DESC,\s*id DESC/);
  assert.ok(calls[1].values.includes('org'));
  assert.ok(calls[1].values.includes('Asia/Kolkata'));
  assert.ok(!calls[1].sql.includes('Asia/Kolkata'));
});
