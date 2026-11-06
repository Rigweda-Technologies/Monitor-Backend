import Joi from 'joi';
import { failure, httpError, success } from '../../plugins/errors.js';

const departmentInput = Joi.object({
  name: Joi.string().trim().min(2).max(120).pattern(/^[A-Za-z ]+$/).required().messages({ 'string.pattern.base': 'Only letters and spaces are allowed' }),
  code: Joi.string().trim().uppercase().min(2).max(20).pattern(/^[A-Z0-9_-]+$/).required().messages({ 'string.pattern.base': 'Only A-Z, 0-9, _ and - are allowed' }),
  managerId: Joi.string().allow(null, ''),
  status: Joi.string().valid('active', 'inactive').default('active'),
});
const departmentUpdate = Joi.object({
  name: Joi.string().trim().min(2).max(120).pattern(/^[A-Za-z ]+$/).messages({ 'string.pattern.base': 'Only letters and spaces are allowed' }),
  code: Joi.string().trim().uppercase().min(2).max(20).pattern(/^[A-Z0-9_-]+$/).messages({ 'string.pattern.base': 'Only A-Z, 0-9, _ and - are allowed' }),
  managerId: Joi.string().allow(null, ''),
  status: Joi.string().valid('active', 'inactive').required(),
});
const bodySchema = {
  type: 'object', additionalProperties: true,
  properties: { name: { type: 'string', minLength: 2, maxLength: 120 }, code: { type: 'string', minLength: 2, maxLength: 20 }, managerId: { type: ['string','null'] }, status: { type: 'string', enum: ['active','inactive'] } },
};
const responseSchema = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const validationResponseSchema = { type: 'object', properties: { code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['code','message','data','error'] };
const validate = schema => (request, reply, done) => {
  const { error, value } = schema.validate(request.body ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] });
  request.body = value;
  done();
};

export const registerDepartmentRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['POST','/','DEPT_CREATE','Create a department',201,'Department created successfully','create',departmentInput],
    ['PUT','/:id','DEPT_UPDATE','Update a department',200,'Department updated successfully','update',departmentUpdate],
    ['DELETE','/:id','DEPT_DELETE','Delete a department',200,'Department deleted successfully','remove'],
    ['GET','/:id','DEPT_VIEW','Get a department',200,'Department fetched successfully','getById'],
    ['GET','/','DEPT_VIEW','List departments',200,'Departments fetched successfully','list'],
  ];
  for (const [method,url,permission,summary,status,message,operation,validation] of routes) {
    const schema = { tags: ['Departments'], summary, security: [{ bearerAuth: [] }], response: { [status]: responseSchema, 401: responseSchema, 403: responseSchema, 404: responseSchema, 406: validationResponseSchema } };
    if (validation) schema.body = { ...bodySchema, required: operation === 'create' ? ['name','code'] : ['status'] };
    if (method === 'GET' && url === '/') schema.querystring = { type: 'object', properties: { organizationId: { type: 'string' }, includeInactive: { type: 'string' } } };
    if (url === '/:id') schema.params = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };
    app.route({
      method, url: `/api/v2/departments${url}`, schema,
      validatorCompiler: () => data => ({ value: data }),
      preValidation: [authenticate, async (request, reply) => {
        const denied = await authorize(permission, request);
        if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message));
      }, ...(validation ? [validate(validation)] : [])],
      handler: async (request, reply) => {
        try {
          const data = await service[operation](request);
          if (operation === 'remove') return reply.code(status).send({ ...success(undefined, message), code: status });
          return reply.code(status).send({ ...success(data, message), code: status });
        } catch (error) {
          const statusCode = Number(error.statusCode || error.code);
          if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599) throw error.statusCode ? error : httpError(statusCode, error.message);
          throw error;
        }
      },
    });
  }
};
