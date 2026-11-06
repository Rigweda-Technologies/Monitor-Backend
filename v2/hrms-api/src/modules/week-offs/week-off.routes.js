import Joi from 'joi';
import { failure, success } from '../../plugins/errors.js';

const objectId = Joi.string().hex().length(24).allow(null, '');
const upsertSchema = Joi.object({ shiftId: objectId.optional(), weekOffDays: Joi.array().items(Joi.number().integer().min(0).max(6)).min(1).required() });
const response = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const validate = schema => (request, reply, done) => {
  const { error, value } = schema.validate(request.body ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] });
  request.body = value; done();
};
export const registerWeekOffRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['POST','/','WEEK_OFF_MANAGE','Save week-off configuration','upsert'],
    ['GET','/','WEEK_OFF_VIEW','Get week-off configuration','get'],
    ['GET','/all','WEEK_OFF_VIEW','List week-off configurations','getAll'],
  ];
  for (const [method,path,permission,summary,operation] of routes) {
    const schema = { tags: ['Week Offs'], summary, security: [{ bearerAuth: [] }], response: { 200: response, 401: response, 403: response, 406: response } };
    if (operation === 'upsert') schema.body = { type: 'object', additionalProperties: false, properties: { shiftId: { type: ['string','null'] }, weekOffDays: { type: 'array', minItems: 1, items: { type: 'integer', minimum: 0, maximum: 6 } } }, required: ['weekOffDays'] };
    if (operation === 'get') schema.querystring = { type: 'object', properties: { shiftId: { type: 'string' } } };
    app.route({ method, url: `/api/v2/week-offs${path}`, schema, validatorCompiler: () => data => ({ value: data }),
      preValidation: [authenticate, async (request, reply) => { const denied = await authorize(permission, request); if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message)); }, ...(operation === 'upsert' ? [validate(upsertSchema)] : [])],
      handler: async (request, reply) => {
        const data = await service[operation](request);
        return success(data, operation === 'upsert' ? 'Week off configuration saved' : 'Success');
      },
    });
  }
};
