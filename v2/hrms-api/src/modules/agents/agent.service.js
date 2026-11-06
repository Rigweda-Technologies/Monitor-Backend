import crypto from 'node:crypto';
import Joi from 'joi';
import { httpError } from '../../plugins/errors.js';
import { endOfDayInTimeZone, isValidTimeZone, startOfDayInTimeZone, toDateKeyInTimeZone } from './agent.timezone.js';

const truthy = new Set(['1','true','yes','on']);
const falsy = new Set(['0','false','no','off']);
const parseBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  return truthy.has(normalized) ? true : falsy.has(normalized) ? false : fallback;
};
const normalizeSettings = body => {
  const cloudName = String(body.cloudName || '').trim();
  const apiKey = String(body.apiKey || '').trim();
  const apiSecret = String(body.apiSecret || '').trim();
  if (!cloudName || !apiKey) throw httpError(400, 'Cloud name and API key are required.');
  const minutes = key => Math.max(Math.trunc(Number(body[key]) || 1), 1);
  return {
    cloudName, apiKey, apiSecret, uploadFolderRoot: String(body.uploadFolderRoot || 'rigweda-monitor').trim(),
    screenshotsEnabled: parseBoolean(body.screenshotsEnabled), mouseEnabled: parseBoolean(body.mouseEnabled),
    keyboardEnabled: parseBoolean(body.keyboardEnabled), appUsageEnabled: parseBoolean(body.appUsageEnabled),
    browserHistoryEnabled: parseBoolean(body.browserHistoryEnabled, false), usbEnabled: parseBoolean(body.usbEnabled),
    screenshotIntervalMinutes: minutes('screenshotIntervalMinutes'), mouseHeartbeatMinutes: minutes('mouseHeartbeatMinutes'),
    mouseIdleThresholdMinutes: minutes('mouseIdleThresholdMinutes'), keyboardHeartbeatMinutes: minutes('keyboardHeartbeatMinutes'),
    appUsageHeartbeatMinutes: minutes('appUsageHeartbeatMinutes'), browserHistorySyncMinutes: minutes('browserHistorySyncMinutes'),
  };
};
const uploadSessionSchema = Joi.object({ batchId:Joi.string().trim().required(), deviceId:Joi.string().trim().required(), screenshots:Joi.array().items(Joi.object({ clientScreenshotId:Joi.string().trim().required(), capturedAt:Joi.date().iso().required(), originalFileName:Joi.string().trim().required(), mimeType:Joi.string().trim().valid('image/png','image/jpeg','image/webp').required(), sha256:Joi.string().hex().length(64).required(), sizeBytes:Joi.number().integer().positive().required(), width:Joi.number().integer().positive().optional(), height:Joi.number().integer().positive().optional() })).min(1).max(100).required() });
const completeSessionSchema = Joi.object({ deviceId:Joi.string().trim().required(), uploaded:Joi.array().items(Joi.object({ clientScreenshotId:Joi.string().trim().required(), cloudinaryPublicId:Joi.string().trim().required(), cloudinaryAssetId:Joi.string().trim().allow(null,''), cloudinaryVersion:Joi.number().integer().optional(), cloudinaryFormat:Joi.string().trim().allow(null,''), cloudinaryUrl:Joi.string().uri().required(), sizeBytes:Joi.number().integer().positive().optional() })).default([]), duplicates:Joi.array().items(Joi.object({ clientScreenshotId:Joi.string().trim().required(), duplicateOf:Joi.string().trim().required() })).default([]) });
const healthSchema = Joi.object({ deviceId:Joi.string().trim().max(200).required(), hostname:Joi.string().trim().max(255).allow('',null), platform:Joi.string().trim().max(100).allow('',null), platformVersion:Joi.string().trim().max(255).allow('',null), agentVersion:Joi.string().trim().max(100).allow('',null), cpuModel:Joi.string().trim().max(255).allow('',null), cpuCoreCount:Joi.number().integer().min(1).max(512).allow(null), cpuPercent:Joi.number().min(0).max(100).allow(null), memoryTotalBytes:Joi.number().integer().min(0).allow(null), memoryUsedBytes:Joi.number().integer().min(0).allow(null), memoryPercent:Joi.number().min(0).max(100).allow(null), disks:Joi.array().items(Joi.object({ mount:Joi.string().trim().max(255).required(), filesystem:Joi.string().trim().max(100).allow('',null), totalBytes:Joi.number().integer().min(0).allow(null), usedBytes:Joi.number().integer().min(0).allow(null), freeBytes:Joi.number().integer().min(0).allow(null), usedPercent:Joi.number().min(0).max(100).allow(null) }).unknown(false)).max(20), temperatureC:Joi.number().min(-50).max(150).allow(null), batteryPercent:Joi.number().min(0).max(100).allow(null), batteryCharging:Joi.boolean().allow(null), uptimeSeconds:Joi.number().integer().min(0).allow(null), reportedAt:Joi.date().iso().allow(null) }).unknown(false);
const validated = (schema, value, message) => {
  const { error, value:validatedValue } = schema.validate(value || {}, { abortEarly:false, stripUnknown:true });
  if (error) throw httpError(400,message, message === 'Invalid laptop health payload'
    ? { fields:error.details.map(detail=>detail.path.join('.')) }
    : error.details.map(detail=>({ field:detail.path.join('.') || 'body', message:detail.message, type:detail.type })));
  return validatedValue;
};
const safePart = value => String(value).toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const dateFolder = value => new Date(value).toISOString().slice(0,10).replaceAll('-','_');
const publicIdFor = item => `${new Date(item.capturedAt).toISOString().replace(/[-:.]/g,'').replace('T','_').replace('Z','')}_${safePart(item.clientScreenshotId).slice(-12)}_${item.sha256.slice(0,12)}`;
const normalizeDisk = disk => ({ mount:String(disk.mount || '').trim(), filesystem:String(disk.filesystem || '').trim() || null, totalBytes:positive(disk.totalBytes), usedBytes:positive(disk.usedBytes), freeBytes:positive(disk.freeBytes), usedPercent:clamp(disk.usedPercent,0,100) });
const positive = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const clamp = (value,min,max) => Number.isFinite(Number(value)) ? Math.min(Math.max(Number(value),min),max) : null;
const parsePositiveInt = (value,fallback) => { const n=Number(value);return Number.isFinite(n)&&n>=1?Math.floor(n):fallback; };
const parseHour = value => { if(value===undefined||value===null||value==='')return null;const n=Number(value);return Number.isInteger(n)&&n>=0&&n<=23?n:null; };
const parseBooleanQuery = value => { if(value===true||value===false)return value;const text=String(value||'').trim().toLowerCase();if(['1','true','yes','y'].includes(text))return true;if(['0','false','no','n'].includes(text))return false;return null; };
const cloudinaryPublicId = row => { const folder=String(row.cloudinary_folder || row.cloudinaryFolder || '').replace(/^\/+|\/+$/g,'');const stored=String(row.cloudinary_public_id || row.cloudinaryPublicId || '').trim();return stored ? folder && !stored.startsWith(`${folder}/`) ? `${folder}/${stored}` : stored : null; };

// monitorRepository is the Prisma boundary for the shared monitor PostgreSQL schema.
// Its exact method contract is listed in the module README comment below.
export const createAgentService = ({ models, monitorRepository, cloudinary, emitMonitorSettingsUpdate = () => {}, now = () => Date.now(), randomUUID = crypto.randomUUID }) => {
  if (!models?.User || !models?.Employee || !monitorRepository) throw new TypeError('Agent service requires User and Employee models and a monitorRepository');
  const organizationIdFor = user => {
    if (!user?.organizationId) throw httpError(403, 'Organization is required');
    return String(user.organizationId);
  };
  const findEmployee = async user => {
    if (user.employeeId) return { _id:user.employeeId, firstName:user.firstName, lastName:user.lastName, employeeCode:user.employeeCode };
    const employee = await models.Employee.findOne({ userId:user.userId, organizationId:user.organizationId, isDeleted:false }).select('_id firstName lastName employeeCode').lean();
    if (!employee) throw httpError(404, 'Employee profile not found for the authenticated user.');
    return employee;
  };
  return {
    authorize: null,
    async getMe(request) {
      const user = await models.User.findById(request.user.userId).select('_id email displayName status').lean();
      if (!user) throw httpError(404, 'Agent profile not found');
      const employee = await models.Employee.findOne({ userId:request.user.userId, organizationId:request.user.organizationId, isDeleted:false }).select('_id firstName lastName employeeCode departmentId designationId profileImage status employmentLifecycleStatus').lean();
      return { user, employee:employee || null };
    },
    getCloudinarySettings: request => monitorRepository.getCloudinarySettings(organizationIdFor(request.user)),
    async saveCloudinarySettings(request) {
      const settings = normalizeSettings(request.body || {});
      const data = await monitorRepository.saveCloudinarySettings(organizationIdFor(request.user), settings);
      emitMonitorSettingsUpdate({ organizationId:request.user.organizationId }, { settings:data, updatedAt:data.updatedAt, source:'cloudinary-settings-save' });
      return data;
    },
    async testCloudinarySettings(request) {
      const settings = normalizeSettings(request.body || {});
      if (!settings.apiSecret) throw httpError(400, 'API secret is required to test Cloudinary settings.');
      await cloudinary.testSettings(settings);
      return { ok:true };
    },
    async getCloudinaryUploadConfig(request) {
      const data = await monitorRepository.getCloudinarySettings(organizationIdFor(request.user));
      if (!data) throw httpError(404, 'Cloudinary monitor settings are not configured for this organization.');
      const { apiSecretMasked, ...publicData } = data;
      return publicData;
    },
    async getUsbControlConfig(request) {
      const data = await monitorRepository.getUsbControlConfig(organizationIdFor(request.user));
      if (!data) throw httpError(404, 'USB monitor settings are not configured for this organization.');
      return data;
    },
    async createUploadSession(request) {
      const payload = validated(uploadSessionSchema, request.body, 'Validation failed');
      const organizationId = organizationIdFor(request.user);
      const employee = await findEmployee(request.user);
      const employeeId = String(employee._id);
      const settings = await monitorRepository.getRawCloudinarySettings(organizationId);
      if (!settings) throw httpError(400, 'Cloudinary monitor settings are not configured for this organization.');
      const batch = { batchId:payload.batchId, organizationId, employeeId, deviceId:payload.deviceId, expectedCount:payload.screenshots.length, expectedBytes:payload.screenshots.reduce((sum,item) => sum + Number(item.sizeBytes || 0),0), firstCapturedAt:payload.screenshots[0].capturedAt, lastCapturedAt:payload.screenshots.at(-1).capturedAt };
      if (!await monitorRepository.createOrUpdateScreenshotBatch(batch)) throw httpError(409, 'Batch identifier is not available for this account');
      const uploads = [];
      for (const item of payload.screenshots) {
        const duplicate = await monitorRepository.findUploadedScreenshotByHash({ organizationId, employeeId, sha256:item.sha256 });
        const folder = `${String(settings.uploadFolderRoot || 'rigweda-monitor').replace(/^\/+|\/+$/g,'')}/${employeeId}/${dateFolder(item.capturedAt)}`;
        const publicId = publicIdFor(item);
        const saved = await monitorRepository.upsertPendingScreenshot({ id:randomUUID(), batchId:payload.batchId, organizationId, employeeId, deviceId:payload.deviceId, item, folder, publicId });
        if (!saved) throw httpError(409, 'Screenshot identifier is not available for this account');
        if (duplicate) {
          uploads.push({ clientScreenshotId:item.clientScreenshotId, status:'duplicate', duplicateOf:duplicate.id, cloudinaryUrl:duplicate.cloudinaryUrl ?? duplicate.cloudinary_url });
        } else {
          uploads.push({ clientScreenshotId:item.clientScreenshotId, status:'upload', cloudinaryPublicId:publicId, ...cloudinary.createSignedUploadPayload({ settings, folder, publicId, timestamp:Math.floor(now()/1000), context:{ batch_id:payload.batchId, employee_id:employeeId, device_id:payload.deviceId, captured_at:item.capturedAt, sha256:item.sha256 } }) });
        }
      }
      return { batchId:payload.batchId, employeeId, deviceId:payload.deviceId, expiresInSeconds:300, uploads };
    },
    async completeUploadSession(request) {
      const payload = validated(completeSessionSchema, request.body, 'Validation failed');
      const organizationId = organizationIdFor(request.user);
      const employee = await findEmployee(request.user);
      const settings = await monitorRepository.getRawCloudinarySettings(organizationId);
      return monitorRepository.completeScreenshotBatch({ ...payload, batchId:request.params.batchId, organizationId, employeeId:String(employee._id), verifyAsset:row => cloudinary.verifyScreenshotAsset({ settings, row }) });
    },
    async getScreenshots(request) {
      const organizationId=organizationIdFor(request.user);
      const query=request.query || {};
      const employeeId=String(query.employeeId || '').trim();
      const date=String(query.date || '').trim();
      const dateFrom=String(query.dateFrom || '').trim();
      const dateTo=String(query.dateTo || '').trim();
      const hour=parseHour(query.hour);
      const onlyWithImage=parseBooleanQuery(query.onlyWithImage);
      const page=parsePositiveInt(query.page,1);
      const limit=Math.min(parsePositiveInt(query.limit,20),200);
      const orgSettings=models.OrgSettings ? await models.OrgSettings.findOne({organizationId}).select('timezone').lean() : null;
      let timezone=isValidTimeZone(orgSettings?.timezone) ? orgSettings.timezone : null;
      if(!timezone && models.Organization){
        const organization=await models.Organization.findById(organizationId).select('timezone').lean();
        if(isValidTimeZone(organization?.timezone))timezone=organization.timezone;
      }
      timezone ||= 'Asia/Kolkata';
      let employeeIds=[];
      if(employeeId){
        try {
          const employee=await models.Employee.findOne({organizationId,$or:[{_id:employeeId},{employeeCode:employeeId},{userId:employeeId}]}).select('_id employeeCode userId').lean();
          employeeIds=employee ? [...new Set([String(employee._id),employee.employeeCode && String(employee.employeeCode),employee.userId && String(employee.userId),employeeId].filter(Boolean))] : [employeeId];
        } catch { employeeIds=[employeeId]; }
      }
      const filters={ organizationId,employeeIds,dateStart:date ? startOfDayInTimeZone(date,timezone) : dateFrom ? startOfDayInTimeZone(dateFrom,timezone) : null,dateEnd:date ? endOfDayInTimeZone(date,timezone) : dateTo ? endOfDayInTimeZone(dateTo,timezone) : null,hour,timezone,onlyWithImage,page,limit,offset:(page-1)*limit };
      const result=await monitorRepository.listScreenshotRows(filters);
      const rows=result.rows || result.items || [];
      const employeeSet=[...new Set(rows.map(row=>String(row.employee_id ?? row.employeeId ?? '')).filter(Boolean))];
      let employeeRecords=[];
      try {
        if(employeeSet.length) employeeRecords=await models.Employee.find({organizationId,$or:[{_id:{$in:employeeSet}},{employeeCode:{$in:employeeSet}},{userId:{$in:employeeSet}}]}).select('firstName lastName employeeCode userId').lean();
      } catch { employeeRecords=[]; }
      const employeeMap=new Map();
      for(const employee of employeeRecords){
        const details={ name:[employee.firstName,employee.lastName].filter(Boolean).join(' ').trim() || null,code:employee.employeeCode || null,employeeId:String(employee._id) };
        employeeMap.set(String(employee._id),details);if(employee.employeeCode)employeeMap.set(String(employee.employeeCode),details);if(employee.userId)employeeMap.set(String(employee.userId),details);
      }
      let settings=null;
      try { settings=await monitorRepository.getRawCloudinarySettings(organizationId); } catch { settings=null; }
      const items=rows.map(row=>{
        const rowEmployeeId=String(row.employee_id ?? row.employeeId ?? '');
        const employee=employeeMap.get(rowEmployeeId) || {};
        const capturedAt=row.captured_at ?? row.capturedAt;
        const uploadStatus=row.upload_status ?? row.uploadStatus;
        const signedImageUrl=uploadStatus==='uploaded' && settings ? cloudinary.buildSignedScreenshotUrl(settings,row,{expiresInSeconds:3600}) : null;
        return { screenshotId:row.id ?? row.screenshotId,attendanceId:null,organizationId:row.organization_id ?? row.organizationId,employeeId:row.employee_id ?? row.employeeId,employeeName:employee.name || null,employeeCode:employee.code || null,date:capturedAt,dateKey:capturedAt ? toDateKeyInTimeZone(capturedAt,timezone) : null,action:'screenshot',capturedAt,imageUrl:signedImageUrl,selfieProvided:Boolean(signedImageUrl),deviceId:row.device_id ?? row.deviceId ?? null,ip:null,status:uploadStatus || null,shiftName:null,shiftCode:null,source:'monitor_db',publicId:cloudinaryPublicId(row),processingStatus:row.processing_status ?? row.processingStatus ?? null };
      });
      return { items,page,limit,count:items.length,total:Number(result.total || 0),timezone,source:'monitor_db' };
    },
    async saveHealth(request) {
      const payload = validated(healthSchema, request.body, 'Invalid laptop health payload');
      const employee = await models.Employee.findOne({ userId:request.user.userId, organizationId:request.user.organizationId, isDeleted:false }).select('_id firstName lastName employeeCode').lean();
      if (!employee) throw httpError(403, 'The authenticated user is not linked to an employee.');
      const reportedAt = payload.reportedAt ? new Date(payload.reportedAt) : new Date(now());
      const disks = (Array.isArray(payload.disks) ? payload.disks : []).filter(disk => String(disk?.mount || '').trim()).slice(0,20).map(normalizeDisk);
      return monitorRepository.upsertDeviceHealth({ organizationId:request.user.organizationId || null, employeeId:String(employee._id), employeeName:[employee.firstName,employee.lastName].filter(Boolean).join(' ').trim() || null, employeeCode:employee.employeeCode || null, deviceId:payload.deviceId, hostname:payload.hostname || null, platform:payload.platform || null, platformVersion:payload.platformVersion || null, agentVersion:payload.agentVersion || null, cpuModel:payload.cpuModel || null, cpuCoreCount:positive(payload.cpuCoreCount), cpuPercent:clamp(payload.cpuPercent,0,100), memoryTotalBytes:positive(payload.memoryTotalBytes), memoryUsedBytes:positive(payload.memoryUsedBytes), memoryPercent:clamp(payload.memoryPercent,0,100), disks, temperatureC:clamp(payload.temperatureC,-50,150), batteryPercent:clamp(payload.batteryPercent,0,100), batteryCharging:typeof payload.batteryCharging === 'boolean' ? payload.batteryCharging : null, uptimeSeconds:positive(payload.uptimeSeconds), reportedAt, lastSeenAt:reportedAt });
    },
  };
};

/*
 * Prisma monitorRepository contract:
 * getCloudinarySettings(orgId), getRawCloudinarySettings(orgId), saveCloudinarySettings(orgId,payload), getUsbControlConfig(orgId),
 * createOrUpdateScreenshotBatch(batch)->boolean, findUploadedScreenshotByHash({organizationId,employeeId,sha256}),
 * upsertPendingScreenshot({id,batchId,organizationId,employeeId,deviceId,item,folder,publicId})->boolean,
 * completeScreenshotBatch({batchId,organizationId,employeeId,deviceId,uploaded,duplicates,verifyAsset}),
 * listScreenshotRows({organizationId,employeeIds,dateStart,dateEnd,hour,timezone,onlyWithImage,page,limit,offset})->{rows,total},
 * upsertDeviceHealth(healthRecord). Prisma listing must filter captured_at by date bounds and organization-local hour and sort captured_at/created_at/id desc.
 * Cloudinary adapter contract: testSettings(settings), createSignedUploadPayload(args), buildSignedScreenshotUrl(settings,row,{expiresInSeconds}), verifyScreenshotAsset({settings,row}).
 */
