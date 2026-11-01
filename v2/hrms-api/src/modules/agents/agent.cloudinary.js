import { v2 as defaultClient } from 'cloudinary';

const verificationFailure = () => Object.assign(new Error('Screenshot upload could not be verified. Retry completion.'), { code:503, statusCode:503 });
const withTimeout = (promise, timeoutMs) => new Promise((resolve,reject) => {
  const timer=setTimeout(()=>reject(Object.assign(new Error('Cloudinary request timed out'),{ code:'ETIMEDOUT' })),timeoutMs);
  Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
});
const publicIdCandidatesFor = row => {
  const folder=String(row.cloudinary_folder || row.cloudinaryFolder || '').replace(/^\/+|\/+$/g,'');
  const stored=String(row.cloudinary_public_id || row.cloudinaryPublicId || '').trim();
  if (!stored) return [];
  const withFolder=folder && !stored.startsWith(`${folder}/`) ? `${folder}/${stored}` : stored;
  return [...new Set([withFolder,stored])];
};
const normalizeAsset = (asset,expectedPublicId) => {
  if (asset?.public_id !== expectedPublicId || asset.resource_type !== 'image' || !asset.asset_id || !Number.isInteger(asset.version) || !String(asset.secure_url || '').startsWith('https://') || !Number.isFinite(asset.bytes) || asset.bytes <= 0) throw verificationFailure();
  return { cloudinaryAssetId:asset.asset_id,cloudinaryVersion:asset.version,cloudinaryFormat:asset.format,cloudinaryUrl:asset.secure_url,sizeBytes:asset.bytes };
};

export const createAgentCloudinaryAdapter = ({ client = defaultClient, timeoutMs = 10000, now = () => Date.now(), sleep = ms => new Promise(resolve=>setTimeout(resolve,ms)), propagationDelays = [0,400,1000,2000] } = {}) => {
  const credentials = settings => {
    if (!settings?.cloudName || !settings?.apiKey || !settings?.apiSecret) throw verificationFailure();
    return { cloud_name:settings.cloudName,api_key:settings.apiKey,api_secret:settings.apiSecret,timeout:timeoutMs };
  };
  return {
    async testSettings(settings) { const creds=credentials(settings); return withTimeout(client.api.ping(creds),timeoutMs); },
    createSignedUploadPayload({ settings,folder,publicId,timestamp,context = {} }) {
      const creds=credentials(settings);
      const params={ folder,public_id:publicId,timestamp,type:'authenticated' };
      if(Object.keys(context).length) params.context=Object.entries(context).map(([key,value])=>`${key}=${String(value).replaceAll('|',' ')}`).join('|');
      return { cloudName:settings.cloudName,apiKey:settings.apiKey,uploadUrl:`https://api.cloudinary.com/v1_1/${settings.cloudName}/image/upload`,params:{ ...params,signature:client.utils.api_sign_request(params,creds.api_secret) } };
    },
    buildSignedScreenshotUrl(settings,row,{ expiresInSeconds = 3600 } = {}) {
      if (!settings?.apiSecret) return null;
      const [publicId]=publicIdCandidatesFor(row);
      if(!publicId)return null;
      return client.url(publicId,{ ...credentials(settings),resource_type:'image',type:'authenticated',secure:true,sign_url:true,expires_at:Math.floor(now()/1000)+expiresInSeconds });
    },
    async verifyScreenshotAsset({ settings,row }) {
      if (!settings?.apiSecret) throw verificationFailure();
      const candidates=publicIdCandidatesFor(row);
      if (!candidates.length) throw verificationFailure();
      let asset=null;
      let expectedPublicId='';
      for (const delayMs of propagationDelays) {
        if (delayMs) await sleep(delayMs);
        for (const publicId of candidates) {
          for (const type of ['authenticated','upload']) {
            try {
              const options={ ...credentials(settings),resource_type:'image',type };
              asset=await withTimeout(client.api.resource(publicId,options),timeoutMs);
              expectedPublicId=publicId;
              break;
            } catch (error) {
              const status=Number(error?.http_code || error?.statusCode || error?.status);
              // 404 can mean either upload type or the just-uploaded asset is not
              // visible yet. Other provider failures stop retries immediately.
              if (status !== 404) throw verificationFailure();
            }
          }
          if(asset)break;
        }
        if(asset)break;
      }
      if(!asset) throw verificationFailure();
      return normalizeAsset(asset,expectedPublicId);
    },
  };
};
