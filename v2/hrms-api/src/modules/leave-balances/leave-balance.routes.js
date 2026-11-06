import Joi from 'joi';
import mongoose from 'mongoose';
import { failure, success } from '../../plugins/errors.js';

const objectId = Joi.string().custom((value, helpers) => mongoose.Types.ObjectId.isValid(value) ? value : helpers.error('any.invalid'));
const paramsSchema = Joi.object({ employeeId: objectId.required() });
const adjustment = Joi.object({ balanceId: objectId, leaveTypeId: objectId, leaveTypeName: Joi.string().trim().min(2).max(120), days: Joi.number().precision(2).not(0).required(), note: Joi.string().trim().max(500).allow('',null) }).or('balanceId','leaveTypeId','leaveTypeName');
const bulkAdjustment = Joi.object({ leaveTypeId: objectId, leaveTypeName: Joi.string().trim().min(2).max(120), days: Joi.number().precision(2).not(0).required(), note: Joi.string().trim().max(500).allow('',null) }).or('leaveTypeId','leaveTypeName');
const response = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const validate = (schema, property = 'body') => (request, reply, done) => { const { error, value } = schema.validate(request[property] ?? {}, { abortEarly: true }); if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] }); request[property] = value; done(); };

export const registerLeaveBalanceRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['GET','/my','LEAVE_VIEW_SELF','Get my leave balances','getMy'],
    ['GET','/employee/:employeeId','LEAVE_VIEW_ALL','Get employee leave balances','getEmployee'],
    ['POST','/employee/:employeeId/adjust','LEAVE_VIEW_ALL','Adjust employee leave balance','adjustEmployee'],
    ['POST','/adjust-all','LEAVE_VIEW_ALL','Adjust all employee leave balances','adjustAll'],
  ];
  for (const [method,path,permission,summary,operation] of routes) {
    const schema = { tags: ['Leave Balances'], summary, security: [{ bearerAuth: [] }], response: { 200: response, 401: response, 403: response, 406: response, 500: response } };
    if (path.includes(':employeeId')) schema.params = { type: 'object', properties: { employeeId: { type: 'string' } }, required: ['employeeId'] };
    if (operation === 'adjustEmployee' || operation === 'adjustAll') schema.body = { type: 'object', additionalProperties: false, properties: { balanceId: { type: 'string' }, leaveTypeId: { type: 'string' }, leaveTypeName: { type: 'string', minLength: 2, maxLength: 120 }, days: { type: 'number' }, note: { type: ['string','null'], maxLength: 500 } }, required: ['days'] };
    app.route({ method, url: `/api/v2/leave-balances${path}`, schema, validatorCompiler: () => data => ({ value: data }), preValidation: [authenticate, async (request, reply) => { const denied = await authorize(permission, request); if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message)); }, ...(path.includes(':employeeId') ? [validate(paramsSchema,'params')] : []), ...(operation === 'adjustEmployee' ? [validate(adjustment)] : operation === 'adjustAll' ? [validate(bulkAdjustment)] : [])], handler: async (request, reply) => {
      try { const data = await service[operation](request); const message = operation === 'adjustEmployee' ? 'Leave balance adjusted successfully' : operation === 'adjustAll' ? 'Leave balance adjusted for all employees successfully' : 'Success'; return reply.code(200).send(success(data, message)); }
      catch (error) { const statusCode = Number(error.statusCode || error.code); if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599) throw error.statusCode ? error : Object.assign(error, { statusCode, publicMessage: error.message }); throw error; }
    } });
  }
};
