import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createMonitorUpdateModels } from '../src/modules/monitor-updates/monitor-update.models.js';
import { createMonitorUpdateService } from '../src/modules/monitor-updates/monitor-update.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('monitor update persistence stores a release and per-device update status', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createMonitorUpdateModels(connection);
  const service = createMonitorUpdateService(models, { releaseStorage: { uploadRelease: async () => ({ signedDownloadUrl: 'https://stubbed.invalid/release' }) } });
  t.after(async () => {
    await Promise.all([models.MonitorRelease.deleteMany({ version: '9001.0.0' }), models.MonitorDeviceUpdate.deleteMany({ deviceId: /^monitor-updates-test-/ })]);
    await connection.close();
  });
  const release = await service.createRelease({ fileBase64: 'c3R1Yg==', version: '9001.0.0', build: 9001, status: 'active' });
  const latest = await service.getLatestRelease({ deviceId: 'monitor-updates-test-device', appVersion: '0.0.0' });
  assert.equal(latest.releaseId, String(release._id));
  assert.equal(latest.downloadUrl, 'https://stubbed.invalid/release');
  await service.recordUpdateStatus({ deviceId: 'monitor-updates-test-device', releaseId: String(release._id), status: 'FAILED', errorMessage: 'test failure' });
  const saved = await models.MonitorDeviceUpdate.findOne({ deviceId: 'monitor-updates-test-device', releaseId: release._id }).lean();
  assert.equal(saved.failureCount, 1);
  assert.equal(saved.updateStatus, 'FAILED');
});

test('monitor release models preserve existing collections and avoid automatic schema changes', async t => {
  const connection = mongoose.createConnection();
  t.after(() => connection.close());
  const { MonitorRelease, MonitorDeviceUpdate } = createMonitorUpdateModels(connection);
  assert.equal(MonitorRelease.collection.collectionName, 'monitorreleases');
  assert.equal(MonitorDeviceUpdate.collection.collectionName, 'monitordeviceupdates');
  assert.equal(MonitorRelease.schema.options.autoCreate, false);
  assert.equal(MonitorRelease.schema.options.autoIndex, false);
  assert.equal(MonitorDeviceUpdate.schema.indexes().some(([keys, options]) => keys.deviceId === 1 && keys.releaseId === 1 && options.unique && options.sparse), true);
});
