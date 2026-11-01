import { v2 as cloudinary } from 'cloudinary';
import { httpError } from '../plugins/errors.js';

export const createCloudinaryAdapter = ({ credentials, timeoutMs = 10000, now = () => Date.now() }) => {
  const configured = () => {
    const { cloudName, apiKey, apiSecret } = credentials || {};
    if (!cloudName || !apiKey || !apiSecret) throw httpError(503, 'Cloudinary credentials are missing or invalid');
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true, timeout: timeoutMs });
  };
  return {
    uploadDataUri(dataUri, options = {}) { configured(); return cloudinary.uploader.upload(dataUri, { resource_type: 'auto', timeout: timeoutMs, ...options }); },
    buildAuthenticatedUrl(publicId, options = {}) { configured(); return cloudinary.url(publicId, { resource_type: options.resourceType || 'auto', type: 'authenticated', secure: true, sign_url: true, expires_at: Math.floor(now() / 1000) + Number(options.expiresInSeconds || 600), flags: options.flags }); },
    deleteAsset(publicId, options = {}) { configured(); return cloudinary.uploader.destroy(publicId, { resource_type: options.resourceType || 'auto', type: options.type || 'authenticated', timeout: timeoutMs }); },
  };
};
