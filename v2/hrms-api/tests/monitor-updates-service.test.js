import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createMonitorUpdateService } from '../src/modules/monitor-updates/monitor-update.service.js';

const query = value => ({ sort() { return this; }, lean: async () => value });

test('latest release selection compares versions and applies deterministic rollout/download metadata', async () => {
  const release = { _id: 'release-1', version: '2.1.0', build: 17, status: 'active', channel: 'stable', rolloutPercentage: 100, mandatory: true, signedDownloadUrl: '', sha256: 'abc', fileSize: 123, releasedAt: new Date('2026-10-01') };
  const service = createMonitorUpdateService({ MonitorRelease: { find: filter => { assert.deepEqual(filter, { channel: 'stable', status: { $in: ['testing','active'] } }); return query([release]); } } }, { defaultDownloadUrl: 'https://updates.example/latest' });
  assert.deepEqual(await service.getLatestRelease({ deviceId: 'device-a', appVersion: '1.8.9' }), { updateAvailable: true, version: '2.1.0', build: 17, mandatory: true, downloadUrl: 'https://updates.example/latest', sha256: 'abc', size: 123, releaseId: 'release-1', releasedAt: release.releasedAt });
  assert.deepEqual(await service.getLatestRelease({ deviceId: 'device-a', appVersion: '2.1.0' }), { updateAvailable: false, version: '2.1.0' });
});

test('release creation persists calculated metadata through the injected storage adapter', async () => {
  const effects = [];
  const models = { MonitorRelease: { create: async document => { effects.push(['create', document]); return { toObject: () => ({ ...document, _id: 'id' }) }; } } };
  const service = createMonitorUpdateService(models, { releaseStorage: { uploadRelease: async args => { effects.push(['upload', args]); return { signedDownloadUrl: 'https://signed.example/file' }; } } });
  const payload = { fileBase64: 'data:application/octet-stream;base64,aGVsbG8=', version: ' 1.2.3 ', build: '5', status: 'active', mandatory: true, rolloutPercentage: '50' };
  const result = await service.createRelease(payload);
  assert.equal(effects[0][0], 'upload');
  assert.equal(effects[0][1].objectKey, 'stable/1.2.3/RigwedaMonitor-1.2.3.exe');
  assert.equal(effects[0][1].fileBuffer.toString(), 'hello');
  assert.equal(effects[1][1].sha256, crypto.createHash('sha256').update('hello').digest('hex'));
  assert.equal(effects[1][1].fileSize, 5);
  assert.equal(effects[1][1].releasedAt instanceof Date, true);
  assert.equal(result.signedDownloadUrl, 'https://signed.example/file');
});

test('update status stores v1 field aliases and increments failure count on failure', async () => {
  let captured;
  const service = createMonitorUpdateService({ MonitorDeviceUpdate: { findOneAndUpdate: async (...args) => { captured = args; return { updateStatus: 'FAILED' }; } } });
  await service.recordUpdateStatus({ deviceId: 'd', releaseId: 'r', fromVersion: '1.0', toVersion: '2.0', status: 'FAILED', timestamp: '2026-10-01T00:00:00Z', errorCode: 'E', errorMessage: 'broken' });
  assert.deepEqual(captured[0], { deviceId: 'd', releaseId: 'r' });
  assert.equal(captured[1].$set.currentVersion, '1.0');
  assert.equal(captured[1].$set.targetVersion, '2.0');
  assert.equal(captured[1].$set.lastUpdateCheckAt.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.deepEqual(captured[1].$inc, { failureCount: 1 });
  assert.deepEqual(captured[2], { upsert: true, new: true, setDefaultsOnInsert: true });
});
