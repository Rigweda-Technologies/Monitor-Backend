import Joi from 'joi';
import { failure, success } from '../../plugins/errors.js';

const namePattern = /^[A-Za-z ]+$/;
const codePattern = /^[A-Z0-9_-]+$/;
const createSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).pattern(namePattern).required().messages({ 'string.pattern.base': 'Only letters and spaces are allowed' }),
  code: Joi.string().trim().uppercase().min(2).max(5).pattern(codePattern).required().messages({ 'string.pattern.base': 'Only A-Z, 0-9, _ and - are allowed' }),
  description: Joi.string().allow(''), daysPerYear: Joi.number().min(0).required(), isCarryForward: Joi.boolean().default(false),
  includeInPayroll: Joi.boolean().default(true), maxCarryForward: Joi.number().min(0).allow(null), status: Joi.string().valid('active','inactive').default('active'),
});
const updateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).pattern(namePattern).messages({ 'string.pattern.base': 'Only letters and spaces are allowed' }),
  code: Joi.string().trim().uppercase().min(2).max(5).pattern(codePattern).messages({ 'string.pattern.base': 'Only A-Z, 0-9, _ and - are allowed' }),
  description: Joi.string().allow(''), daysPerYear: Joi.number().min(0), isCarryForward: Joi.boolean(),
  includeInPayroll: Joi.boolean(), maxCarryForward: Joi.number().min(0).allow(null), status: Joi.string().valid('active','inactive'),
});
const response = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const validate = schema => (request, reply, done) => {
  const { error, value } = schema.validate(request.body ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] });
  request.body = value;
  done();
};
export const registerLeaveTypeRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['POST','/','LEAVE_TYPE_MANAGE','Create a leave type',201,'Success','create',createSchema],
    ['GET','/','LEAVE_TYPE_VIEW','List leave types',200,'Success','list'],
    ['PUT','/:id','LEAVE_TYPE_MANAGE','Update a leave type',200,'Leave type updated successfully','update',updateSchema],
    ['DELETE','/:id','LEAVE_TYPE_MANAGE','Deactivate a leave type',200,'Leave type deactivated successfully','remove'],
  ];
  for (const [method,path,permission,summary,status,message,operation,validator] of routes) {
    const schema = { tags: ['Leave Types'], summary, security: [{ bearerAuth: [] }], response: { [status]: response, 401: response, 403: response, 404: response, 406: response, 409: response } };
    if (validator) schema.body = { type: 'object', additionalProperties: false, properties: {
      name: { type: 'string' }, code: { type: 'string' }, description: { type: 'string' }, daysPerYear: { type: 'number', minimum: 0 },
      isCarryForward: { type: 'boolean' }, includeInPayroll: { type: 'boolean' }, maxCarryForward: { type: ['number','null'], minimum: 0 }, status: { type: 'string', enum: ['active','inactive'] },
    }, ...(operation === 'create' ? { required: ['name','code','daysPerYear'] } : {}) };
    if (path === '/:id') schema.params = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };
    app.route({ method, url: `/api/v2/leave-types${path}`, schema, validatorCompiler: () => data => ({ value: data }),
      preValidation: [authenticate, async (request, reply) => {
        const denied = await authorize(permission, request);
        if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message));
      }, ...(validator ? [validate(validator)] : [])],
      handler: async (request, reply) => {
        let data;
        if (operation === 'create') data = await service.create(request);
        else if (operation === 'list') data = await service.list(request.user.organizationId);
        else if (operation === 'update') data = await service.update(request);
        else { await service.remove(request); data = null; }
        return reply.code(status).send({ ...success(data, message), code: operation === 'create' || operation === 'list' ? 200 : status });
      },
    });
  }
};
