import { failure, success } from '../../plugins/errors.js';

const response = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: { type: 'array', items: { type: 'object', additionalProperties: true } }, error: {} }, required: ['success','code','message','data','error'] };
const errorResponse = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
export const registerPermissionRoutes = async (app, { service, authenticate, authorize }) => {
  app.get('/api/v2/permissions/', {
    schema: { tags: ['Permissions'], summary: 'List organization permissions', security: [{ bearerAuth: [] }], response: { 200: response, 401: errorResponse, 403: errorResponse } },
    preValidation: [authenticate, async (request, reply) => {
      const denied = await authorize('PERMISSION_VIEW', request);
      if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message));
    }],
  }, async request => ({ ...success(await service.listPermissions(request.user.organizationId), 'Permissions fetched successfully') }));
};
