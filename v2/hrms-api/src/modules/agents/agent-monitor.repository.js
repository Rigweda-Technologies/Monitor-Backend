import crypto from 'node:crypto';
import { httpError } from '../../plugins/errors.js';

const encryptionKey = value => crypto.createHash('sha256').update(String(value || process.env.MONITOR_SETTINGS_SECRET || process.env.JWT_SECRET || 'monitor-settings-dev-key')).digest();
const encryptSecret = (secret, key) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const value = Buffer.concat([cipher.update(String(secret), 'utf8'), cipher.final()]);
  return { ciphertext: value.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') };
};
const decryptSecret = (row, key) => {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(row.api_secret_iv, 'base64'));
  decipher.setAuthTag(Buffer.from(row.api_secret_auth_tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(row.api_secret_ciphertext, 'base64')), decipher.final()]).toString('utf8');
};
const minutes = value => Math.min(Math.max(Math.trunc(Number(value) || 1), 1), 240);
const normalizeFolder = value => String(value || 'rigweda-monitor').trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/') || 'rigweda-monitor';
const normalizeBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim().toLowerCase();
  if (['1','true','yes','on'].includes(text)) return true;
  if (['0','false','no','off'].includes(text)) return false;
  return fallback;
};
const masked = secret => !secret ? '' : secret.length <= 6 ? '******' : `${secret.slice(0,3)}******${secret.slice(-3)}`;
const publicSettings = (row, secret) => ({
  cloudName:row.cloud_name, apiKey:row.api_key, apiSecretMasked:masked(secret), uploadFolderRoot:row.upload_folder_root || 'rigweda-monitor',
  screenshotsEnabled:row.screenshots_enabled ?? true, mouseEnabled:row.mouse_enabled ?? true, keyboardEnabled:row.keyboard_enabled ?? true,
  appUsageEnabled:row.app_usage_enabled ?? true, browserHistoryEnabled:row.browser_history_enabled ?? false, usbEnabled:row.usb_enabled ?? true,
  screenshotIntervalMinutes:minutes(row.screenshot_interval_minutes), mouseHeartbeatMinutes:minutes(row.mouse_heartbeat_minutes),
  mouseIdleThresholdMinutes:minutes(row.mouse_idle_threshold_minutes), keyboardHeartbeatMinutes:minutes(row.keyboard_heartbeat_minutes),
  appUsageHeartbeatMinutes:minutes(row.app_usage_heartbeat_minutes), browserHistorySyncMinutes:minutes(row.browser_history_sync_minutes), updatedAt:row.updated_at,
});
const rawSettings = (row, secret) => ({ ...publicSettings(row, secret), apiSecret:secret });
const one = rows => rows[0] || null;
const denied = () => httpError(404, 'Screenshot batch or item not found for this account.');

export const createAgentMonitorRepository = ({ prisma, encryptionSecret, now = () => new Date() }) => {
  if (!prisma?.$queryRawUnsafe) throw new TypeError('Agent monitor repository requires a Prisma client.');
  const key = encryptionKey(encryptionSecret);
  const query = (client, sql, ...values) => client.$queryRawUnsafe(sql, ...values);
  const getRow = async organizationId => one(await query(prisma, 'SELECT * FROM monitor_cloudinary_settings WHERE organization_id = $1', String(organizationId)));
  const decrypt = row => decryptSecret(row, key);
  const availableSettingsColumns = async () => new Set((await query(prisma, `
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'monitor_cloudinary_settings'
  `)).map(row => row.column_name));
  const settingFields = [
    ['screenshots_enabled','screenshotsEnabled',true], ['mouse_enabled','mouseEnabled',true], ['keyboard_enabled','keyboardEnabled',true],
    ['app_usage_enabled','appUsageEnabled',true], ['browser_history_enabled','browserHistoryEnabled',false], ['usb_enabled','usbEnabled',true],
    ['screenshot_interval_minutes','screenshotIntervalMinutes',1], ['mouse_heartbeat_minutes','mouseHeartbeatMinutes',1],
    ['mouse_idle_threshold_minutes','mouseIdleThresholdMinutes',1], ['keyboard_heartbeat_minutes','keyboardHeartbeatMinutes',1],
    ['app_usage_heartbeat_minutes','appUsageHeartbeatMinutes',1], ['browser_history_sync_minutes','browserHistorySyncMinutes',1],
  ];
  const settingsFromRow = (row, secret) => {
    const result = publicSettings(row, secret);
    for (const [column, field, fallback] of settingFields) if (!Object.hasOwn(row, column)) result[field] = fallback;
    return result;
  };
  return {
    async getRawCloudinarySettings(organizationId) {
      const row = await getRow(organizationId);
      return row ? { ...settingsFromRow(row,decrypt(row)), apiSecret:decrypt(row) } : null;
    },
    async getCloudinarySettings(organizationId) {
      const row = await getRow(organizationId);
      return row ? settingsFromRow(row,decrypt(row)) : null;
    },
    async getUsbControlConfig(organizationId) {
      const available = await availableSettingsColumns();
      const usbColumn = available.has('usb_enabled') ? 'usb_enabled' : 'TRUE AS usb_enabled';
      const row = one(await query(prisma, `SELECT ${usbColumn}, updated_at FROM monitor_cloudinary_settings WHERE organization_id = $1`, String(organizationId)));
      return row ? { usbEnabled:row.usb_enabled ?? true, updatedAt:row.updated_at } : null;
    },
    async saveCloudinarySettings(organizationId, payload) {
      const existing = await getRow(organizationId);
      const resolvedSecret = String(payload.apiSecret || '').trim() || (existing ? decrypt(existing) : '');
      if (!resolvedSecret) throw httpError(400, 'API secret is required when creating monitor settings.');
      const encrypted = encryptSecret(resolvedSecret, key);
      const available = await availableSettingsColumns();
      const columns = settingFields.filter(([column]) => available.has(column));
      const insertColumns = ['organization_id','cloud_name','api_key','api_secret_ciphertext','api_secret_iv','api_secret_auth_tag','upload_folder_root',...columns.map(([column])=>column)];
      const insertValues = [String(organizationId),String(payload.cloudName||'').trim(),String(payload.apiKey||'').trim(),encrypted.ciphertext,encrypted.iv,encrypted.tag,normalizeFolder(payload.uploadFolderRoot),...columns.map(([,field,fallback])=>{
        const value=payload[field];
        if (field.endsWith('Minutes')) return minutes(value ?? fallback);
        return normalizeBoolean(value,fallback);
      })];
      const updates = insertColumns.slice(1).map(column=>`${column}=EXCLUDED.${column}`).join(',');
      const row = one(await query(prisma, `
        INSERT INTO monitor_cloudinary_settings (
          ${insertColumns.join(',')}
        ) VALUES (${insertValues.map((_,index)=>`$${index+1}`).join(',')})
        ON CONFLICT (organization_id) DO UPDATE SET ${updates},updated_at=NOW() RETURNING *`,...insertValues));
      return row ? settingsFromRow(row,resolvedSecret) : null;
    },
    async createOrUpdateScreenshotBatch(batch) {
      const rows = await query(prisma, `INSERT INTO monitor_screenshot_batches (
        id,organization_id,employee_id,device_id,status,expected_count,expected_bytes,first_captured_at,last_captured_at
      ) VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8) ON CONFLICT (device_id,id) DO UPDATE SET
        expected_count=EXCLUDED.expected_count, expected_bytes=EXCLUDED.expected_bytes,
        first_captured_at=EXCLUDED.first_captured_at,last_captured_at=EXCLUDED.last_captured_at
        WHERE monitor_screenshot_batches.organization_id=EXCLUDED.organization_id
          AND monitor_screenshot_batches.employee_id=EXCLUDED.employee_id RETURNING id`,
      batch.batchId,batch.organizationId,batch.employeeId,batch.deviceId,batch.expectedCount,batch.expectedBytes,batch.firstCapturedAt,batch.lastCapturedAt);
      return rows.length === 1;
    },
    async findUploadedScreenshotByHash({ organizationId, employeeId, sha256 }) {
      const row = one(await query(prisma, `SELECT * FROM monitor_screenshots WHERE organization_id=$1 AND employee_id=$2 AND sha256=$3
        AND upload_status='uploaded' AND cloudinary_public_id IS NOT NULL ORDER BY captured_at DESC LIMIT 1`, organizationId,employeeId,sha256));
      return row ? { ...row, cloudinaryUrl:row.cloudinary_url } : null;
    },
    async upsertPendingScreenshot({ id,batchId,organizationId,employeeId,deviceId,item,folder,publicId }) {
      const rows = await query(prisma, `INSERT INTO monitor_screenshots (
        id,batch_id,organization_id,employee_id,device_id,client_screenshot_id,captured_at,original_file_name,mime_type,
        width,height,sha256,size_bytes,cloudinary_folder,cloudinary_public_id,upload_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending')
      ON CONFLICT (device_id,client_screenshot_id) DO UPDATE SET batch_id=EXCLUDED.batch_id,size_bytes=EXCLUDED.size_bytes,
        cloudinary_folder=EXCLUDED.cloudinary_folder,cloudinary_public_id=EXCLUDED.cloudinary_public_id
      WHERE monitor_screenshots.organization_id=EXCLUDED.organization_id AND monitor_screenshots.employee_id=EXCLUDED.employee_id
      RETURNING id`, id,batchId,organizationId,employeeId,deviceId,item.clientScreenshotId,item.capturedAt,item.originalFileName,item.mimeType,
      item.width || null,item.height || null,item.sha256,item.sizeBytes,folder,publicId);
      return rows.length === 1;
    },
    async completeScreenshotBatch({ organizationId,employeeId,deviceId,batchId,uploaded=[],duplicates=[],verifyAsset }) {
      if (!organizationId || !employeeId || !deviceId || !batchId) throw denied();
      const ids = [...uploaded,...duplicates].map(item => item.clientScreenshotId);
      if (new Set(ids).size !== ids.length) throw httpError(400,'Repeated screenshot IDs.');
      return prisma.$transaction(async tx => {
        const txQuery = (sql,...values) => query(tx,sql,...values);
        const scope = [String(organizationId),String(employeeId),deviceId,batchId];
        if (!one(await txQuery(`SELECT id FROM monitor_screenshot_batches WHERE organization_id=$1 AND employee_id=$2 AND device_id=$3 AND id=$4 FOR UPDATE`,...scope))) throw denied();
        const items = await txQuery(`SELECT * FROM monitor_screenshots WHERE organization_id=$1 AND employee_id=$2 AND device_id=$3 AND batch_id=$4 AND client_screenshot_id=ANY($5::text[]) FOR UPDATE`,...scope,ids);
        if (items.length !== ids.length) throw denied();
        const verified = new Map();
        const verify = async row => {
          if (typeof verifyAsset !== 'function') throw httpError(503,'Upload verifier unavailable');
          if (!verified.has(row.id)) verified.set(row.id,await verifyAsset(row));
          return verified.get(row.id);
        };
        for (const claimed of uploaded) {
          const row = items.find(item => item.client_screenshot_id === claimed.clientScreenshotId);
          const asset = { ...await verify(row),clientScreenshotId:claimed.clientScreenshotId };
          const result = await txQuery(`UPDATE monitor_screenshots SET cloudinary_asset_id=$6,cloudinary_version=$7,cloudinary_format=$8,
            cloudinary_url=$9,size_bytes=COALESCE($10,size_bytes),upload_status='uploaded',error_message=NULL,uploaded_at=NOW()
            WHERE organization_id=$1 AND employee_id=$2 AND device_id=$3 AND batch_id=$4 AND client_screenshot_id=$5 RETURNING id`,
          ...scope,asset.clientScreenshotId,asset.cloudinaryAssetId || null,asset.cloudinaryVersion || null,asset.cloudinaryFormat || null,asset.cloudinaryUrl,asset.sizeBytes || null);
          if (result.length !== 1) throw denied();
        }
        for (const duplicate of duplicates) {
          const source = one(await txQuery(`SELECT source.* FROM monitor_screenshots source JOIN monitor_screenshots target ON target.sha256=source.sha256
            WHERE target.organization_id=$1 AND target.employee_id=$2 AND target.device_id=$3 AND target.batch_id=$4
              AND target.client_screenshot_id=$5 AND source.id=$6 AND source.organization_id=$1 AND source.employee_id=$2
              AND source.upload_status='uploaded' AND source.id<>target.id`,...scope,duplicate.clientScreenshotId,duplicate.duplicateOf));
          if (!source) throw denied();
          await verify(source);
          const result = await txQuery(`UPDATE monitor_screenshots target SET duplicate_of=source.id,upload_status='duplicate',processing_status='complete',uploaded_at=NOW()
            FROM monitor_screenshots source WHERE target.organization_id=$1 AND target.employee_id=$2 AND target.device_id=$3 AND target.batch_id=$4
              AND target.client_screenshot_id=$5 AND source.id=$6 AND source.organization_id=$1 AND source.employee_id=$2
              AND source.sha256=target.sha256 AND source.upload_status='uploaded' AND source.cloudinary_public_id IS NOT NULL AND source.id<>target.id
            RETURNING target.id`,...scope,duplicate.clientScreenshotId,duplicate.duplicateOf);
          if (result.length !== 1) throw denied();
        }
        const result = one(await txQuery(`WITH counts AS (
          SELECT COUNT(*) FILTER (WHERE upload_status='uploaded') AS uploaded_count,COUNT(*) FILTER (WHERE upload_status='duplicate') AS duplicate_count,
            COALESCE(SUM(size_bytes) FILTER (WHERE upload_status='uploaded'),0) AS uploaded_bytes FROM monitor_screenshots
          WHERE organization_id=$1 AND employee_id=$2 AND device_id=$3 AND batch_id=$4
        ) UPDATE monitor_screenshot_batches b SET uploaded_count=counts.uploaded_count,duplicate_count=counts.duplicate_count,
          uploaded_bytes=counts.uploaded_bytes,status=CASE WHEN counts.uploaded_count+counts.duplicate_count>=b.expected_count THEN 'complete' ELSE 'partial' END,
          completed_at=CASE WHEN counts.uploaded_count+counts.duplicate_count>=b.expected_count THEN NOW() ELSE b.completed_at END
          FROM counts WHERE b.organization_id=$1 AND b.employee_id=$2 AND b.device_id=$3 AND b.id=$4 RETURNING b.*`,...scope));
        if (!result) throw denied();
        return { ...result,acknowledgedScreenshotIds:ids };
      });
    },
    async listScreenshotRows({ organizationId,employeeIds=[],dateStart,dateEnd,hour,timezone,onlyWithImage,page,limit,offset }) {
      const values=[organizationId]; const where=['organization_id=$1'];
      if(employeeIds.length){values.push(employeeIds);where.push(`employee_id=ANY($${values.length}::text[])`);}
      if(dateStart){values.push(dateStart);where.push(`captured_at >= $${values.length}`);}
      if(dateEnd){values.push(dateEnd);where.push(`captured_at <= $${values.length}`);}
      if(hour!==null&&hour!==undefined){values.push(hour);values.push(timezone);where.push(`EXTRACT(HOUR FROM captured_at AT TIME ZONE $${values.length})::integer = $${values.length-1}`);}
      if(onlyWithImage===true)where.push("cloudinary_url IS NOT NULL AND upload_status='uploaded'");
      else if(onlyWithImage===false)where.push("(cloudinary_url IS NULL OR upload_status<>'uploaded')");
      const clause=where.join(' AND ');
      const count=one(await query(prisma,`SELECT COUNT(*)::integer AS total FROM monitor_screenshots WHERE ${clause}`,...values));
      const rows=await query(prisma,`SELECT id,batch_id,organization_id,employee_id,device_id,client_screenshot_id,captured_at,original_file_name,
        mime_type,width,height,size_bytes,cloudinary_folder,cloudinary_public_id,cloudinary_asset_id,cloudinary_url,upload_status,
        processing_status,created_at,uploaded_at FROM monitor_screenshots WHERE ${clause}
        ORDER BY captured_at DESC,created_at DESC,id DESC LIMIT $${values.length+1} OFFSET $${values.length+2}`,...values,limit,offset);
      return { rows,total:Number(count?.total||0) };
    },
    async upsertDeviceHealth(record) {
      const keys=['organizationId','employeeId','employeeName','employeeCode','deviceId','hostname','platform','platformVersion','agentVersion','cpuModel','cpuCoreCount','cpuPercent','memoryTotalBytes','memoryUsedBytes','memoryPercent','disks','temperatureC','batteryPercent','batteryCharging','uptimeSeconds','lastSeenAt','reportedAt'];
      const values=keys.map(key=>record[key] ?? null); values[15]=JSON.stringify(record.disks || []);
      const columns=['organization_id','employee_id','employee_name','employee_code','device_id','hostname','platform','platform_version','agent_version','cpu_model','cpu_core_count','cpu_percent','memory_total_bytes','memory_used_bytes','memory_percent','disks','temperature_c','battery_percent','battery_charging','uptime_seconds','last_seen_at','reported_at'];
      const updates=columns.slice(1).map(column=>`${column}=EXCLUDED.${column}`).join(',');
      const row=one(await query(prisma,`INSERT INTO monitor_device_health (${columns.join(',')}) VALUES (${columns.map((_,index)=>`$${index+1}${index===15?'::jsonb':''}`).join(',')})
        ON CONFLICT (organization_id,device_id) DO UPDATE SET ${updates},updated_at=NOW() RETURNING *`,...values));
      if (!row) throw httpError(500,'Could not save device health.');
      return { id:String(row.id),organizationId:row.organization_id,employeeId:row.employee_id,employee:{ id:row.employee_id,name:row.employee_name||null,code:row.employee_code||null },deviceId:row.device_id,hostname:row.hostname,platform:row.platform,platformVersion:row.platform_version,agentVersion:row.agent_version,cpuModel:row.cpu_model,cpuCoreCount:row.cpu_core_count===null?null:Number(row.cpu_core_count),cpuPercent:row.cpu_percent===null?null:Number(row.cpu_percent),memoryTotalBytes:row.memory_total_bytes===null?null:Number(row.memory_total_bytes),memoryUsedBytes:row.memory_used_bytes===null?null:Number(row.memory_used_bytes),memoryPercent:row.memory_percent===null?null:Number(row.memory_percent),disks:row.disks||[],temperatureC:row.temperature_c===null?null:Number(row.temperature_c),batteryPercent:row.battery_percent===null?null:Number(row.battery_percent),batteryCharging:row.battery_charging,uptimeSeconds:row.uptime_seconds===null?null:Number(row.uptime_seconds),lastSeenAt:row.last_seen_at,reportedAt:row.reported_at,createdAt:row.created_at,updatedAt:row.updated_at };
    },
  };
};
