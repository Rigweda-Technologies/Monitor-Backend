import { httpError } from '../plugins/errors.js';
const payload = value => { const trimmed = value.trim(); const result = trimmed.startsWith('data:') ? (trimmed.includes(',') ? trimmed.slice(trimmed.indexOf(',') + 1) : '') : trimmed; if (!result) throw httpError(400, 'Invalid selfie image payload'); return result; };
export const createFaceVerifier = ({ config, timeoutMs, fetchImpl = fetch }) => {
  const call = async (url, parameters, type) => {
    const body = new URLSearchParams({ api_key: config.apiKey, api_secret: config.apiSecret, ...parameters });
    let result;
    try {
      const response = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(), signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
      result = await response.json();
      if (response.ok === false && !result?.error_message) throw new Error('Provider unavailable');
    } catch { throw httpError(502, type === 'liveness' ? 'Face liveness service is unreachable' : 'Face verification service is unreachable'); }
    if (result?.error_message) {
      // Do not reflect provider text: it may contain credentials or request data.
      throw httpError(400, type === 'liveness' ? 'Face liveness failed' : 'Face verification failed');
    }
    return result;
  };
  const eyes = async image => {
    const result = await call(config.detectUrl, { image_base64: payload(image), return_attributes: 'eyestatus' }, 'liveness');
    const eye = result?.faces?.[0]?.attributes?.eyestatus;
    if (!eye) throw httpError(400, 'No clear face detected for liveness check');
    const max = (side, keys) => Math.max(...keys.map(key => Number(side?.[key] || 0)));
    const score = keys => Math.min(max(eye.left_eye_status, keys), max(eye.right_eye_status, keys));
    return { open: score(['no_glass_eye_open','normal_glass_eye_open','dark_glasses']), closed: score(['no_glass_eye_close','normal_glass_eye_close']) };
  };
  return async ({ profileImageUrl, selfieImage, livenessSelfieImage }) => {
    payload(selfieImage);
    payload(livenessSelfieImage);
    if (!config.apiKey || !config.apiSecret) throw httpError(503, 'Selfie login provider is not configured. Set FACEPP_API_KEY and FACEPP_API_SECRET.');
    const open = await eyes(selfieImage);
    if (!Number.isFinite(open.open) || open.open < 50 || open.open <= open.closed) throw httpError(401, 'Liveness check failed: first selfie must have eyes open');
    const closed = await eyes(livenessSelfieImage);
    if (!Number.isFinite(closed.closed) || closed.closed < 50 || closed.closed <= closed.open) throw httpError(401, 'Liveness check failed: second selfie must have eyes closed');
    const result = await call(config.compareUrl, { image_url1: profileImageUrl, image_base64_2: payload(selfieImage) }, 'compare');
    const confidence = Number(result?.confidence || 0);
    if (!Number.isFinite(confidence) || confidence < config.confidence) throw httpError(401, `Face match failed (confidence ${Number.isFinite(confidence) ? confidence.toFixed(2) : '0.00'}). Please try again.`);
    return { confidence };
  };
};
