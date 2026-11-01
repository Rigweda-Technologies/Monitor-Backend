import Joi from 'joi';
import mongoose from 'mongoose';
import { failure, success } from '../../plugins/errors.js';

const objectId = Joi.string().custom((value, helpers) => mongoose.Types.ObjectId.isValid(value) ? value : helpers.error('any.invalid'));
const step = Joi.object({ stepNumber: Joi.number().integer().min(1).required(), approverType: Joi.string().valid('manager','role','employee').required(), roleSlug: Joi.when('approverType', { is: 'role', then: Joi.string().trim().min(2).required(), otherwise: Joi.optional().allow(null,'') }), employeeId: Joi.when('approverType', { is: 'employee', then: objectId.required(), otherwise: Joi.optional().allow(null,'') }) });
const createSchema = Joi.object({ moduleKey: Joi.string().valid('leave','attendance_request').required(), name: Joi.string().trim().min(2).max(120).pattern(/^[A-Za-z ]+$/).required().messages({ 'string.pattern.base': 'Only letters and spaces are allowed' }), isActive: Joi.boolean().default(true), minDays: Joi.number().min(0).required(), maxDays: Joi.number().min(0).allow(null), steps: Joi.array().items(step).min(1).required() });
const updateSchema = Joi.object({ moduleKey: Joi.string().valid('leave','attendance_request'), name: Joi.string().trim().min(2).max(120).pattern(/^[A-Za-z ]+$/).messages({ 'string.pattern.base': 'Only letters and spaces are allowed' }), isActive: Joi.boolean(), minDays: Joi.number().min(0), maxDays: Joi.number().min(0).allow(null), steps: Joi.array().items(step).min(1) });
const response = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const validate = schema => (request, reply, done) => { const { error, value } = schema.validate(request.body ?? {}, { abortEarly: true }); if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] }); request.body = value; done(); };

export const registerApprovalFlowRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['POST','/','APPROVAL_FLOW_MANAGE','Create an approval flow',201,'Approval flow created','create',createSchema],
    ['GET','/','APPROVAL_FLOW_VIEW','List approval flows',200,'Success','list'],
    ['PUT','/:id','APPROVAL_FLOW_MANAGE','Update an approval flow',200,'Approval flow updated','update',updateSchema],
    ['DELETE','/:id','APPROVAL_FLOW_MANAGE','Deactivate an approval flow',200,'Approval flow deleted','remove'],
  ];
  for (const [method,path,permission,summary,status,message,operation,validation] of routes) {
    const schema = { tags: ['Approval Flows'], summary, security: [{ bearerAuth: [] }], response: { [status]: response, 401: response, 403: response, 406: response, 500: response } };
    if (validation) {
      schema.body = {
        type: 'object', additionalProperties: false,
        properties: {
          moduleKey: { type: 'string', enum: ['leave','attendance_request'] },
          name: { type: 'string', minLength: 2, maxLength: 120 }, isActive: { type: 'boolean' },
          minDays: { type: 'number', minimum: 0 }, maxDays: { type: ['number','null'], minimum: 0 },
          steps: { type: 'array', minItems: 1, items: { type: 'object', properties: {
            stepNumber: { type: 'integer', minimum: 1 }, approverType: { type: 'string', enum: ['manager','role','employee'] },
            roleSlug: { type: ['string','null'] }, employeeId: { type: ['string','null'] },
          }, required: ['stepNumber','approverType'] } },
        }, required: operation === 'create' ? ['moduleKey','name','minDays','steps'] : [],
      };
    }
    if (operation === 'list') schema.querystring = { type: 'object', properties: { moduleKey: { type: 'string', enum: ['leave','attendance_request'] } } };
    if (path === '/:id') schema.params = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };
    app.route({ method, url: `/api/v2/approval-flows${path}`, schema, validatorCompiler: () => data => ({ value: data }), preValidation: [authenticate, async (request, reply) => { const denied = await authorize(permission, request); if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message)); }, ...(validation ? [validate(validation)] : [])], handler: async (request, reply) => reply.code(status).send({ ...success(await service[operation](request), message), code: operation === 'create' ? 200 : status }) });
  }
};
