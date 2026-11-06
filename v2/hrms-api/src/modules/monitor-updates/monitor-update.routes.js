import { failure, success } from '../../plugins/errors.js';

const envelope = data => ({ type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data, error: {} }, required: ['success','code','message','data','error'] });
const objectData = { type: 'object', additionalProperties: true };
const releaseRequest = { type: 'object', properties: { fileBase64: { type: 'string' }, version: { type: 'string' }, build: { type: ['integer','string'] }, channel: { type: 'string' }, sha256: { type: 'string' }, mandatory: { type: 'boolean' }, status: { type: 'string' }, rolloutPercentage: { type: ['integer','string'] }, minimumSupportedVersion: { type: 'string' }, releasedAt: { type: 'string', format: 'date-time' } }, additionalProperties: true };
const statusRequest = { type: 'object', properties: { deviceId: { type: 'string' }, employeeId: { type: 'string' }, hostname: { type: 'string' }, currentVersion: { type: 'string' }, fromVersion: { type: 'string' }, targetVersion: { type: 'string' }, toVersion: { type: 'string' }, releaseId: { type: 'string' }, status: { type: 'string' }, timestamp: { type: 'string', format: 'date-time' }, errorCode: { type: 'string' }, errorMessage: { type: 'string' } }, additionalProperties: true };
const errorResponse = { 400: envelope, 401: envelope, 500: envelope };
const respond = async (reply, operation, message, status, failureMessage, ...args) => {
  try { const response = success(await operation(...args), message); response.code = status; return reply.code(status).send(response); }
  catch (error) {
    const code = Number(error?.code || error?.statusCode || 500);
    const safeMessage = error?.message || failureMessage;
    return reply.code(code).send(failure(code, safeMessage, safeMessage));
  }
};

export const registerMonitorUpdateRoutes = async (app, { service, authenticate }) => {
  const routes = [
    { method: 'GET', url: '/releases', summary: 'List monitor releases', dataSchema: { type: 'array', items: objectData }, status: 200, message: 'Release list fetched successfully', fallback: 'Failed to fetch releases', operation: request => service.listReleases(request) },
    { method: 'POST', url: '/releases', summary: 'Create a monitor release', dataSchema: objectData, status: 201, message: 'Release created successfully', fallback: 'Failed to create release', body: releaseRequest, operation: request => service.createRelease(request.body || {}) },
    { method: 'PATCH', url: '/releases/:releaseId', summary: 'Update a monitor release', dataSchema: { type: ['object','null'], additionalProperties: true }, status: 200, message: 'Release updated successfully', fallback: 'Failed to update release', body: { type: 'object', properties: { status: { type: 'string' }, rolloutPercentage: { type: ['number','string'] } }, additionalProperties: true }, params: { type: 'object', properties: { releaseId: { type: 'string' } }, required: ['releaseId'] }, operation: request => service.activateRelease({ releaseId: request.params.releaseId, status: request.body?.status, rolloutPercentage: request.body?.rolloutPercentage }) },
    { method: 'GET', url: '/update/latest', summary: 'Check for the latest monitor update', dataSchema: { type: 'object', properties: { updateAvailable: { type: 'boolean' }, version: { type: 'string' }, build: { type: 'integer' }, mandatory: { type: 'boolean' }, downloadUrl: { type: 'string' }, sha256: { type: 'string' }, size: { type: 'integer' }, releaseId: { type: 'string' }, releasedAt: { type: ['string','null'], format: 'date-time' } }, required: ['updateAvailable','version'], additionalProperties: false }, status: 200, message: 'Update check completed', fallback: 'Failed to check for updates', querystring: { type: 'object', properties: { version: { type: 'string' } }, additionalProperties: true }, headers: { type: 'object', properties: { 'x-device-id': { type: 'string' }, 'x-app-version': { type: 'string' } }, additionalProperties: true }, operation: request => service.getLatestRelease({ deviceId: request.headers['x-device-id'] || request.body?.deviceId || 'unknown-device', appVersion: request.headers['x-app-version'] || request.query.version || request.body?.appVersion }) },
    { method: 'POST', url: '/update/status', summary: 'Record monitor update status', dataSchema: objectData, status: 200, message: 'Update status saved', fallback: 'Failed to save update status', body: statusRequest, operation: request => service.recordUpdateStatus(request.body || {}) },
  ];
  for (const route of routes) {
    const schema = { tags: ['Monitor Updates'], summary: route.summary, security: [{ bearerAuth: [] }], response: { [route.status]: envelope(route.dataSchema || objectData), ...Object.fromEntries(Object.entries(errorResponse).map(([code]) => [code, envelope({ type: ['object','null'], additionalProperties: true })])) } };
    for (const key of ['body','params','querystring','headers']) if (route[key]) schema[key] = route[key];
    app.route({ method: route.method, url: `/api/v2/monitor${route.url}`, schema, validatorCompiler: () => data => ({ value: data }), preValidation: [authenticate], handler: (request, reply) => respond(reply, route.operation, route.message, route.status, route.fallback, request) });
  }
};
