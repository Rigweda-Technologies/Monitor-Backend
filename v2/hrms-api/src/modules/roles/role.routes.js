import Joi from 'joi';
import mongoose from 'mongoose';
import { failure, httpError, success } from '../../plugins/errors.js';

const objectId = Joi.string().custom((value, helpers) => mongoose.Types.ObjectId.isValid(value) ? value : helpers.error('any.invalid'));
const createSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).pattern(/^[A-Za-z ]+$/).required().messages({ 'string.pattern.base': 'Only letters and spaces are allowed' }),
  slug: Joi.string().trim().lowercase().min(2).max(50).pattern(/^[a-z0-9_]+$/).required().messages({ 'string.pattern.base': 'Slug can contain only lowercase letters, numbers and underscores' }),
  permissionIds: Joi.array().items(objectId).optional(), isSystemRole: Joi.boolean().optional(),
});
const updateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).pattern(/^[A-Za-z ]+$/).messages({ 'string.pattern.base': 'Only letters and spaces are allowed' }),
  permissionIds: Joi.array().items(objectId).min(1).optional(), status: Joi.string().valid('active','inactive').optional(),
});
const switchSchema = Joi.object({ roleId: objectId.required() }).required();
const response = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const validationResponse = { type: 'object', properties: { code: { type: 'integer' }, message: { type: 'string' }, data: { type:'null' }, error: { type:'array' } }, required: ['code','message','data','error'] };
const validate = schema => (request, reply, done) => {
  const { error, value } = schema.validate(request.body ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({code:406,message:error.details[0].message,data:null,error:[]});
  request.body = value;
  done();
};

export const registerRoleRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['POST','/','ROLE_CREATE','Create a role',201,'Role created successfully','create',createSchema,true],
    ['PUT','/:id','ROLE_UPDATE','Update a role',200,'Role updated successfully','update',updateSchema,true],
    ['DELETE','/:id','ROLE_DELETE','Deactivate a role',200,'Role deactivated successfully','remove',null,true],
    ['GET','/','ROLE_VIEW','List organization roles',200,'Success','list',null,true],
    ['GET','/:id','ROLE_VIEW','Get a role',200,'Success','getById',null,true],
    ['POST','/switch',null,'Switch active role',200,'Role switched successfully','switchRole',switchSchema,false],
  ];
  for (const [method,path,permission,summary,status,message,operation,validation,protectedRoute] of routes) {
    const schema = { tags: ['Roles'], summary, security: [{ bearerAuth: [] }], response: { [status]: response, 401: response, 403: response, 404: response, 406: validationResponse, 409: response } };
    if (validation) schema.body = { type: 'object', additionalProperties: false, properties: operation === 'create' ? { name: { type: 'string' }, slug: { type: 'string' }, permissionIds: { type: 'array', items: { type: 'string' } }, isSystemRole: { type: 'boolean' } } : operation === 'update' ? { name: { type: 'string' }, permissionIds: { type: 'array', items: { type: 'string' } }, status: { type: 'string', enum: ['active','inactive'] } } : { roleId: { type: 'string' } }, required: operation === 'create' ? ['name','slug'] : operation === 'switchRole' ? ['roleId'] : [] };
    if (path === '/:id') schema.params = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };
    app.route({
      method, url: `/api/v2/roles${path}`, schema, validatorCompiler: () => data => ({ value: data }),
      preValidation: [authenticate, ...(protectedRoute ? [async (request, reply) => {
        const denied = await authorize(permission, request);
        if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message));
      }] : []), ...(validation ? [validate(validation)] : [])],
      handler: async (request, reply) => {
        try {
          let responseMessage = message;
          let data;
          if (operation === 'create') data = await service.create({ ...request.body, organizationId: request.user.organizationId });
          else if (operation === 'update') data = await service.update(request.params.id, request.user.organizationId, request.body);
          else if (operation === 'remove') data = await service.remove(request.params.id, request.user.organizationId);
          else if (operation === 'list') data = await service.list(request.user.organizationId);
          else if (operation === 'getById') data = await service.getById(request.params.id, request.user.organizationId);
          else data = await service.switchRole(request);
          if (operation === 'switchRole' && !data.alreadyActive) reply.header('Authorization', `Bearer ${data.token}`);
          if (operation === 'switchRole' && data.alreadyActive) responseMessage = 'Role already active';
          if (operation === 'remove') data = null;
          else if (operation === 'switchRole' && data.alreadyActive) data = { activeRoleId: data.activeRoleId, activeRole: data.activeRole };
          else if (operation === 'switchRole') data = { token: data.token, activeRoleId: data.activeRoleId, activeRole: data.activeRole };
          return reply.code(status).send({ ...success(data, responseMessage), code: status });
        } catch (error) {
          const code = Number(error.statusCode || error.code);
          if (Number.isInteger(code) && code >= 400 && code <= 599) throw error.statusCode ? error : httpError(code, error.message);
          throw error;
        }
      },
    });
  }
};
