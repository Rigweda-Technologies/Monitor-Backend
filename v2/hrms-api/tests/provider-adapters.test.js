import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudinaryAdapter } from '../src/integrations/cloudinary.js';
import { createFirebasePushSender } from '../src/integrations/firebase-push.js';
import { createR2ReleaseStorage } from '../src/integrations/r2-release-storage.js';

test('Cloudinary adapter fails closed when credentials are unavailable', async () => {
  const cloudinary = createCloudinaryAdapter({ credentials: {} });
  assert.throws(() => cloudinary.uploadDataUri('data:image/png;base64,AA=='), { statusCode: 503, publicMessage: 'Cloudinary credentials are missing or invalid' });
  assert.throws(() => cloudinary.buildAuthenticatedUrl('document'), { statusCode: 503 });
});

test('Firebase sender skips without tokens or configured service-account credentials', async () => {
  const sender = createFirebasePushSender({ config: {}, timeoutMs: 100 });
  assert.deepEqual(await sender({ tokens: [] }), { skipped: true, reason: 'no_tokens' });
  assert.deepEqual(await sender({ tokens: ['token'] }), { skipped: true, reason: 'fcm_not_configured' });
});

test('R2 release storage signs deterministic URLs and bounds provider uploads', async () => {
  const calls = [];
  const storage = createR2ReleaseStorage({ config: { accountId: 'account', accessKeyId: 'access', secretAccessKey: 'synthetic-secret', bucket: 'updates', urlExpiresSeconds: 60 }, now: () => new Date('2026-11-01T00:00:00.000Z'), timeoutMs: 100, fetchImpl: async (url, options) => { calls.push({ url, options }); return { ok: true }; } });
  const result = await storage.uploadRelease({ fileBuffer: Buffer.from('synthetic-release'), objectKey: 'stable/2.0/RigwedaMonitor-2.0.exe' });
  assert.match(calls[0].url, /^https:\/\/updates\.account\.r2\.cloudflarestorage\.com\//);
  assert.equal(calls[0].options.method, 'PUT');
  assert.equal(calls[0].options.body.toString(), 'synthetic-release');
  assert.equal(new URL(result.signedDownloadUrl).searchParams.get('X-Amz-Expires'), '60');
  assert.ok(!result.signedDownloadUrl.includes('synthetic-secret'));
});
