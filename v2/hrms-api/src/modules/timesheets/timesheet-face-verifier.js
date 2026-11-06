import { httpError } from '../../plugins/errors.js';

const payload = value => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('data:')) return trimmed;
  const comma = trimmed.indexOf(',');
  return comma >= 0 ? trimmed.slice(comma + 1) : '';
};

export const createAttendanceFaceVerifier = ({ config, timeoutMs = 10000, fetchImpl = fetch } = {}) => async ({ profileImageUrl, selfieImage }) => {
  if (!config?.apiKey || !config?.apiSecret) throw httpError(503, 'Selfie face verification is not configured. Contact admin.');
  const image = payload(selfieImage);
  if (!image) throw httpError(400, 'Invalid selfie image payload');
  const body = new URLSearchParams({ api_key: config.apiKey, api_secret: config.apiSecret, image_url1: profileImageUrl, image_base64_2: image });
  let result;
  try {
    const response = await fetchImpl(config.compareUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(), signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
    result = await response.json();
  } catch {
    throw httpError(502, 'Face verification service is unreachable');
  }
  if (result?.error_message) throw httpError(400, `Face verification failed: ${result.error_message}`);
  const confidence = Number(result?.confidence || 0);
  return { passed: confidence >= Number(config.confidence ?? 70), confidence };
};
