import { failure, success } from '../../plugins/errors.js';

const envelope = data => ({ type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data, error: {} }, required: ['success','code','message','data','error'] });
const dataSchema = {};
const bodyObject = { type: 'object', additionalProperties: true };
const errorDataSchema = { type: ['object','null'], additionalProperties: true };
const errorSchemas = { 400: envelope(errorDataSchema), 401: envelope(errorDataSchema), 403: envelope(errorDataSchema), 404: envelope(errorDataSchema), 409: envelope(errorDataSchema), 500: envelope(errorDataSchema) };
const responseSchemas = status => ({ [status]: envelope(dataSchema), ...errorSchemas });
const routePermissions = {
  me: 'EMP_SELF_VIEW', settingsRead: ['ORG_SETTINGS_VIEW','ATTENDANCE_VIEW_ALL'], settingsWrite: 'ORG_SETTINGS_VIEW', agentRead: ['EMP_SELF_VIEW','EMP_VIEW','ATTENDANCE_VIEW_ALL'], upload: ['EMP_SELF_VIEW','EMP_VIEW'], screenshotRead: 'ATTENDANCE_VIEW_ALL', health: 'EMP_SELF_VIEW',
};
const schema = (summary, status, { body, params, querystring } = {}) => ({ tags: ['Agents'], summary, security: [{ bearerAuth: [] }], ...(body ? { body } : {}), ...(params ? { params } : {}), ...(querystring ? { querystring } : {}), response: responseSchemas(status) });

const send = async (reply, authorize, operation, request, { status = 200, message, permission } = {}) => {
  if (permission) {
    const denied = await authorize(permission, request);
    if (denied) return reply.code(denied.code || 403).send(failure(denied.code || 403, denied.message || 'Permission denied'));
  }
  try {
    const result = await operation(request);
    const response = success(result, message);
    response.code = status;
    return reply.code(status).send(response);
  } catch (error) {
    const candidate = Number(error?.code || error?.statusCode || 500);
    const code = Number.isInteger(candidate) && candidate >= 100 && candidate <= 599 ? candidate : 500;
    const messageText = error?.message || 'Something went wrong';
    if (messageText === 'Invalid laptop health payload') { const response = success(error?.data || null, messageText); response.code = code; return reply.code(code).send(response); }
    return reply.code(code).send(failure(code, messageText, error?.data || error?.error || error?.details || null));
  }
};

const uploadBody = {
  type: 'object', required: ['batchId','deviceId','screenshots'], additionalProperties: true,
  properties: { batchId: { type: 'string', minLength: 1 }, deviceId: { type: 'string', minLength: 1 }, screenshots: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'object', required: ['clientScreenshotId','capturedAt','originalFileName','mimeType','sha256','sizeBytes'], properties: { clientScreenshotId: { type: 'string' }, capturedAt: { type: 'string', format: 'date-time' }, originalFileName: { type: 'string' }, mimeType: { type: 'string', enum: ['image/png','image/jpeg','image/webp'] }, sha256: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' }, sizeBytes: { type: 'integer', minimum: 1 }, width: { type: 'integer', minimum: 1 }, height: { type: 'integer', minimum: 1 } }, additionalProperties: true } } },
};
const completeBody = { type: 'object', required: ['deviceId'], additionalProperties: true, properties: { deviceId: { type: 'string', minLength: 1 }, uploaded: { type: 'array', items: { type: 'object', required: ['clientScreenshotId','cloudinaryPublicId','cloudinaryUrl'], properties: { clientScreenshotId: { type: 'string' }, cloudinaryPublicId: { type: 'string' }, cloudinaryAssetId: { type: ['string','null'] }, cloudinaryVersion: { type: 'integer' }, cloudinaryFormat: { type: ['string','null'] }, cloudinaryUrl: { type: 'string', format: 'uri' }, sizeBytes: { type: 'integer', minimum: 1 } }, additionalProperties: true } }, duplicates: { type: 'array', items: { type: 'object', required: ['clientScreenshotId','duplicateOf'], properties: { clientScreenshotId: { type: 'string' }, duplicateOf: { type: 'string' } }, additionalProperties: true } } } };
const healthBody = { type: 'object', required: ['deviceId'], additionalProperties: false, properties: { deviceId:{type:'string',maxLength:200}, hostname:{type:['string','null'],maxLength:255}, platform:{type:['string','null'],maxLength:100}, platformVersion:{type:['string','null'],maxLength:255}, agentVersion:{type:['string','null'],maxLength:100}, cpuModel:{type:['string','null'],maxLength:255}, cpuCoreCount:{type:['integer','null'],minimum:1,maximum:512}, cpuPercent:{type:['number','null'],minimum:0,maximum:100}, memoryTotalBytes:{type:['integer','null'],minimum:0}, memoryUsedBytes:{type:['integer','null'],minimum:0}, memoryPercent:{type:['number','null'],minimum:0,maximum:100}, disks:{type:'array',maxItems:20,items:{type:'object',required:['mount'],additionalProperties:false,properties:{mount:{type:'string',maxLength:255},filesystem:{type:['string','null'],maxLength:100},totalBytes:{type:['integer','null'],minimum:0},usedBytes:{type:['integer','null'],minimum:0},freeBytes:{type:['integer','null'],minimum:0},usedPercent:{type:['number','null'],minimum:0,maximum:100}}}},temperatureC:{type:['number','null'],minimum:-50,maximum:150},batteryPercent:{type:['number','null'],minimum:0,maximum:100},batteryCharging:{type:['boolean','null']},uptimeSeconds:{type:['integer','null'],minimum:0},reportedAt:{type:['string','null'],format:'date-time'} } };

export const registerAgentRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['GET','/api/v2/agents/me','Get the current agent profile',200,'Agent profile fetched successfully',routePermissions.me,'getMe'],
    ['GET','/api/v2/agents/screenshots','List monitor screenshots',200,'Screenshots fetched successfully',routePermissions.screenshotRead,'getScreenshots',null,null,{ type:'object', properties:{ employeeId:{type:'string'},date:{type:'string'},dateFrom:{type:'string'},dateTo:{type:'string'},hour:{type:'string'},onlyWithImage:{type:'string'},page:{type:'string'},limit:{type:'string'} }, additionalProperties:true }],
    ...['/monitor-settings/cloudinary','/cloudinary'].map(path => ['GET',`/api/v2/agents${path}`,'Get Cloudinary monitor settings',200,'Cloudinary settings fetched successfully',routePermissions.settingsRead,'getCloudinarySettings']),
    ...['/monitor-settings/cloudinary','/cloudinary'].map(path => ['PUT',`/api/v2/agents${path}`,'Save Cloudinary monitor settings',200,'Cloudinary settings saved successfully',routePermissions.settingsWrite,'saveCloudinarySettings',bodyObject]),
    ['POST','/api/v2/agents/cloudinary','Save Cloudinary monitor settings',200,'Cloudinary settings saved successfully',routePermissions.settingsWrite,'saveCloudinarySettings',bodyObject],
    ...['/monitor-settings/cloudinary/test','/cloudinary/test'].map(path => ['POST',`/api/v2/agents${path}`,'Test Cloudinary monitor settings',200,'Cloudinary connection verified',routePermissions.settingsWrite,'testCloudinarySettings',bodyObject]),
    ...['/monitor-settings/cloudinary/upload-config','/cloudinary/upload-config'].map(path => ['GET',`/api/v2/agents${path}`,'Get Cloudinary upload configuration',200,'Cloudinary upload config fetched successfully',routePermissions.agentRead,'getCloudinaryUploadConfig']),
    ...['/monitor-settings/usb/control-config','/usb/control-config'].map(path => ['GET',`/api/v2/agents${path}`,'Get USB monitor configuration',200,'USB control config fetched successfully',routePermissions.agentRead,'getUsbControlConfig']),
    ['POST','/api/v2/agents/screenshot-batches/uploads','Create a screenshot upload session',201,'Cloudinary upload session created successfully',routePermissions.upload,'createUploadSession',uploadBody],
    ['POST','/api/v2/agents/screenshot-batches/:batchId/complete','Complete a screenshot upload session',200,'Cloudinary upload session completed successfully',routePermissions.upload,'completeUploadSession',completeBody,{type:'object',required:['batchId'],properties:{batchId:{type:'string'}},additionalProperties:false}],
    ['POST','/api/v2/agents/health','Record agent device health',200,'Laptop health saved',routePermissions.health,'saveHealth',healthBody],
  ];
  for (const [method,url,summary,status,message,permission,operation,body,params,querystring] of routes) {
    app.route({ method, url, schema: schema(summary,status,{body,params,querystring}), validatorCompiler: () => data => ({ value:data }), preValidation: [authenticate], handler: (request,reply) => send(reply,authorize,req => service[operation](req),request,{status,message,permission}) });
  }
};
