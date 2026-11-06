import Joi from 'joi';
import { failure, success } from '../../plugins/errors.js';

const name = Joi.string().trim().min(2).max(120).pattern(/^[A-Za-z &-]+$/).required().messages({ 'string.pattern.base': 'Only letters, spaces, & and - are allowed' });
const createSchema = Joi.object({ name, level: Joi.number().optional(), departmentId: Joi.string().required(), status: Joi.string().valid('active','inactive').default('active') });
const updateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).pattern(/^[A-Za-z &-]+$/).messages({ 'string.pattern.base': 'Only letters, spaces, & and - are allowed' }),
  level: Joi.number().optional(), departmentId: Joi.string().required(), status: Joi.string().valid('active','inactive').optional(),
});
const successSchema = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const failureSchema = { type: 'object', properties: { message: { type: 'string' }, data: { type: 'null' }, error: {} }, required: ['message','data','error'] };
const validationFailureSchema = { type: 'object', properties: { code: { type: 'integer' }, message: { type: 'string' }, data: { type: 'null' }, error: { type: 'array' } }, required: ['code','message','data','error'], additionalProperties: false };
const validate = schema => (request, reply, done) => {
  const { error, value } = schema.validate(request.body ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] });
  request.body = value;
  done();
};
export const registerDesignationRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['POST','/','DESIG_CREATE','Create a designation',201,'Designation created','create',createSchema],
    ['PUT','/:id','DESIG_UPDATE','Update a designation',200,'Designation updated','update',updateSchema],
    ['DELETE','/:id','DESIG_DELETE','Delete a designation',200,'Designation deleted','remove'],
    ['GET','/','DESIG_VIEW','List designations',200,'Designations fetched','list'],
  ];
  for (const [method,path,permission,summary,status,message,operation,validation] of routes) {
    const schema = { tags: ['Designations'], summary, security: [{ bearerAuth: [] }], response: { [status]: successSchema, 401: successSchema, 403: successSchema, 404: failureSchema, 406: validationFailureSchema, 500: failureSchema } };
    if (validation) schema.body = { type: 'object', additionalProperties: false, properties: { name: { type: 'string' }, level: { type: 'number' }, departmentId: { type: 'string' }, status: { type: 'string', enum: ['active','inactive'] } }, required: operation === 'create' ? ['name','departmentId'] : ['departmentId'] };
    if (path === '/:id') schema.params = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };
    if (method === 'GET') schema.querystring = { type: 'object', properties: { departmentId: { type: 'string' }, includeInactive: { type: 'string' } } };
    app.route({ method, url: `/api/v2/designations${path}`, schema, validatorCompiler: () => data => ({ value: data }),
      preValidation: [authenticate, async (request, reply) => {
        const denied = await authorize(permission, request);
        if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message));
      }, ...(validation ? [validate(validation)] : [])],
      handler: async (request, reply) => {
        try {
          const data = await service[operation](request);
          const body = operation === 'remove' ? success(null, message) : success(data, message);
          return reply.code(status).send(body);
        } catch (error) {
          const code = Number(error.statusCode || error.code);
          if (Number.isInteger(code) && code >= 400 && code <= 599) return reply.code(code).send({ message: error.message || 'Internal Server Error', data: null, error: code === 500 ? 'Something went wrong' : error.message || 'Something went wrong' });
          return reply.code(500).send({ message: 'Internal Server Error', data: null, error: 'Something went wrong' });
        }
      },
    });
  }
};
