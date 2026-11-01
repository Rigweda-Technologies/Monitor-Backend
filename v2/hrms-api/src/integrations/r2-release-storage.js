import crypto from 'node:crypto';
import { httpError } from '../plugins/errors.js';

const hmac = (key, value, encoding) => crypto.createHmac('sha256', key).update(value).digest(encoding);
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

export const createR2ReleaseStorage = ({ config = {}, fetchImpl = globalThis.fetch, now = () => new Date(), timeoutMs = 10000 } = {}) => {
  const credentials = () => ({ accountId: String(config.accountId || '').trim(), accessKeyId: String(config.accessKeyId || '').trim(), secretAccessKey: String(config.secretAccessKey || '').trim(), bucket: String(config.bucket || 'rigweda-monitor-updates').trim() });
  const signUrl = (objectKey, method = 'GET') => {
    const { accountId, accessKeyId, secretAccessKey, bucket } = credentials();
    if (!accountId || !accessKeyId || !secretAccessKey) return null;
    const expiresInSeconds = Number.isInteger(config.urlExpiresSeconds) && config.urlExpiresSeconds > 0 ? config.urlExpiresSeconds : 900;
    const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
    const amzDate = now().toISOString().replace(/[:-]|\.\d{3}/g, ''); const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`; const algorithm = 'AWS4-HMAC-SHA256';
    const credential = `${accessKeyId}/${credentialScope}`;
    const canonicalUri = `/${objectKey.split('/').map(encodeURIComponent).join('/')}`;
    const query = [`X-Amz-Algorithm=${encodeURIComponent(algorithm)}`,`X-Amz-Credential=${encodeURIComponent(credential)}`,`X-Amz-Date=${encodeURIComponent(amzDate)}`,`X-Amz-Expires=${expiresInSeconds}`,'X-Amz-SignedHeaders=host'].join('&');
    const canonicalRequest = [method,canonicalUri,query,`host:${host}\n`,'host','UNSIGNED-PAYLOAD'].join('\n');
    const stringToSign = [algorithm,amzDate,credentialScope,hash(canonicalRequest)].join('\n');
    const dateKey = hmac(`AWS4${secretAccessKey}`,dateStamp); const regionKey = hmac(dateKey,'auto'); const serviceKey = hmac(regionKey,'s3'); const signingKey = hmac(serviceKey,'aws4_request');
    const signature = hmac(signingKey,stringToSign,'hex');
    return `https://${host}${canonicalUri}?${query}&X-Amz-Signature=${signature}`;
  };
  return {
    signUrl,
    async uploadRelease({ fileBuffer, objectKey }) {
      const uploadUrl = signUrl(objectKey,'PUT');
      if (!uploadUrl) return { signedDownloadUrl: '' };
      try {
        const response = await fetchImpl(uploadUrl,{ method:'PUT',headers:{'content-length':String(fileBuffer.length)},body:fileBuffer,signal:AbortSignal.timeout(timeoutMs),redirect:'error' });
        if (!response.ok) throw new Error('R2 upload failed');
      } catch { throw httpError(502,'R2 upload failed'); }
      return { signedDownloadUrl: signUrl(objectKey,'GET') || '' };
    },
  };
};
