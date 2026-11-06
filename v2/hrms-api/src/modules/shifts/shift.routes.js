import Joi from 'joi';
import mongoose from 'mongoose';
import { failure, success } from '../../plugins/errors.js';

const objectId = Joi.string().custom((value, helpers) => mongoose.Types.ObjectId.isValid(value) ? value : helpers.error('any.invalid'));
const time = /^([01]\d|2[0-3]):([0-5]\d)$/;
const name = Joi.string().trim().min(2).max(80).pattern(/^[A-Za-z ]+$/).messages({ 'string.pattern.base': 'Only letters and spaces are allowed' });
const code = Joi.string().trim().uppercase().min(2).max(20).pattern(/^[A-Z0-9_-]+$/).messages({ 'string.pattern.base': 'Only A-Z, 0-9, _ and - are allowed' });
const createSchema = Joi.object({ name: name.required(), code: code.required(), startTime: Joi.string().pattern(time).required(), endTime: Joi.string().pattern(time).required(), graceMinutes: Joi.number().integer().min(0).max(180).default(0), status: Joi.string().valid('active','inactive').default('active') });
const updateSchema = Joi.object({ name, code, startTime: Joi.string().pattern(time), endTime: Joi.string().pattern(time), graceMinutes: Joi.number().integer().min(0).max(180), status: Joi.string().valid('active','inactive') });
const paramsSchema = Joi.object({ id: objectId.required() });
const response = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const validate = (schema, property = 'body') => (request, reply, done) => {
  const { error, value } = schema.validate(request[property] ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] });
  request[property] = value; done();
};
export const registerShiftRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['POST','/','SHIFT_MANAGE','Create a shift','create'], ['GET','/','SHIFT_VIEW','List shifts','list'],
    ['GET','/my','SHIFT_VIEW_SELF','Get my shift','myShift'], ['PUT','/:id','SHIFT_MANAGE','Update a shift','update'], ['DELETE','/:id','SHIFT_MANAGE','Deactivate a shift','remove'],
  ];
  for (const [method,path,permission,summary,operation] of routes) {
    const schema = { tags: ['Shifts'], summary, security: [{ bearerAuth: [] }], response: { 200: response, 201: response, 401: response, 403: response, 406: response, 500: response } };
    if (operation === 'create' || operation === 'update') schema.body = { type: 'object', additionalProperties: false, properties: { name: { type: 'string' }, code: { type: 'string' }, startTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' }, endTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' }, graceMinutes: { type: 'integer', minimum: 0, maximum: 180 }, status: { type: 'string', enum: ['active','inactive'] } }, ...(operation === 'create' ? { required: ['name','code','startTime','endTime'] } : {}) };
    if (path === '/:id') schema.params = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };
    app.route({ method, url: `/api/v2/shifts${path}`, schema, validatorCompiler: () => data => ({ value: data }),
      preValidation: [authenticate, async (request, reply) => { const denied = await authorize(permission, request); if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message)); }, ...(operation === 'create' ? [validate(createSchema)] : operation === 'update' ? [validate(paramsSchema,'params'),validate(updateSchema)] : operation === 'remove' ? [validate(paramsSchema,'params')] : [])],
      handler: async (request, reply) => {
        const data = await service[operation](request);
        const message = operation === 'create' ? 'Shift created' : operation === 'update' ? 'Shift updated' : operation === 'remove' ? 'Shift deactivated' : 'Success';
        return reply.code(operation === 'create' ? 201 : 200).send({ ...success(data, message), code: 200 });
      },
    });
  }
};
