import Joi from 'joi';
import { failure, success } from '../../plugins/errors.js';

const namePattern = /^[A-Za-z ]+$/;
const createSchema = Joi.object({ name: Joi.string().trim().min(3).max(120).pattern(namePattern).required().messages({ 'string.pattern.base': 'Only letters and spaces are allowed' }), date: Joi.date().required(), status: Joi.string().valid('active','inactive').default('active') });
const updateSchema = Joi.object({ name: Joi.string().trim().min(3).max(120).pattern(namePattern).messages({ 'string.pattern.base': 'Only letters and spaces are allowed' }), date: Joi.date().optional(), status: Joi.string().valid('active','inactive').optional() });
const response = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const validate = schema => (request, reply, done) => {
  const { error, value } = schema.validate(request.body ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] });
  request.body = value;
  done();
};
export const registerHolidayRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['POST','/','HOLIDAY_MANAGE','Create a holiday',201,'create',createSchema],
    ['GET','/',['HOLIDAY_VIEW','LEAVE_VIEW_SELF','LEAVE_APPLY'],'List holidays',200,'list'],
    ['PUT','/:id','HOLIDAY_MANAGE','Update a holiday',200,'update',updateSchema],
    ['DELETE','/:id','HOLIDAY_MANAGE','Delete a holiday',200,'remove'],
  ];
  for (const [method,path,permission,summary,status,operation,validator] of routes) {
    const schema = { tags: ['Holidays'], summary, security: [{ bearerAuth: [] }], response: { [status]: response, 401: response, 403: response, 406: response, 500: response } };
    if (validator) schema.body = { type: 'object', additionalProperties: false, properties: { name: { type: 'string' }, date: { type: 'string', format: 'date-time' }, status: { type: 'string', enum: ['active','inactive'] } }, required: operation === 'create' ? ['name','date'] : [] };
    if (path === '/:id') schema.params = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };
    if (method === 'GET') schema.querystring = { type: 'object', properties: { year: { type: 'string' } } };
    app.route({ method, url: `/api/v2/holidays${path}`, schema, validatorCompiler: () => data => ({ value: data }),
      preValidation: [authenticate, async (request, reply) => { const denied = await authorize(permission, request); if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message)); }, ...(validator ? [validate(validator)] : [])],
      handler: async (request, reply) => {
        let data = null; let message;
        if (operation === 'create') { await service.create(request); message = `${request.body.name} Holiday created`; }
        else if (operation === 'list') { data = await service.list(request); message = 'Success'; }
        else if (operation === 'update') { data = await service.update(request.params.id, request); message = 'Holiday updated'; }
        else { await service.remove(request.params.id, request); message = 'Holiday deleted'; }
        return reply.code(status).send({ ...success(data, message), code: 200 });
      },
    });
  }
};
