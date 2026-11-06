import { failure, success } from '../../plugins/errors.js';
import { applyLeaveSchema, leaveActionSchema, leaveRevertRequestSchema, leaveRevertActionSchema } from './leave.validation.js';

const response = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success', 'code', 'message', 'data', 'error'] };
const validationResponse = { type: 'object', properties: { code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['code', 'message', 'data', 'error'] };
const bodySchemas = {
  apply: { type: 'object', additionalProperties: false, required: ['leaveTypeId', 'fromDate', 'toDate', 'reason'], properties: { leaveTypeId: { type: 'string' }, fromDate: { type: 'string', format: 'date-time' }, toDate: { type: 'string', format: 'date-time' }, duration: { type: 'string', enum: ['full_day', 'half_day'] }, halfDaySession: { type: 'string', enum: ['first_half', 'second_half'] }, reason: { type: 'string', minLength: 3, maxLength: 500 } } },
  action: { type: 'object', additionalProperties: false, required: ['status'], properties: { status: { type: 'string', enum: ['approved', 'rejected', 'cancelled'] }, rejectionReason: { type: 'string', minLength: 3 } } },
  requestRevert: { type: 'object', additionalProperties: false, required: ['fromDate', 'toDate'], properties: { fromDate: { type: 'string', format: 'date-time' }, toDate: { type: 'string', format: 'date-time' }, reason: { type: 'string', maxLength: 500 } } },
  revertAction: { type: 'object', additionalProperties: false, required: ['status'], properties: { status: { type: 'string', enum: ['approved', 'rejected'] }, rejectionReason: { type: 'string', minLength: 3 } } },
};
const validate = schema => (request, reply, done) => {
  const { error, value } = schema.validate(request.body ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] });
  request.body = value;
  done();
};

export const registerLeaveRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    ['POST', '/apply', 'LEAVE_APPLY', 'Apply for leave', 201, 'apply', applyLeaveSchema],
    ['GET', '/my', 'LEAVE_VIEW_SELF', 'List my leave requests', 200, 'myLeaves'],
    ['GET', '/my-range', 'LEAVE_VIEW_SELF', 'List approved leave in a date range', 200, 'myLeavesRange'],
    ['GET', '/apply-context', 'LEAVE_APPLY', 'Get leave application context', 200, 'applyContext'],
    ['GET', '/', 'LEAVE_VIEW_ALL', 'List organization leave requests', 200, 'list'],
    ['GET', '/pending/my-approvals', 'LEAVE_ACTION', 'List my pending approvals', 200, 'pendingMyApprovals'],
    ['PUT', '/:id/action', 'LEAVE_ACTION', 'Approve, reject or cancel a leave request', 200, 'action', leaveActionSchema],
    ['POST', '/:id/revert-request', 'LEAVE_VIEW_SELF', 'Request a leave reversal', 200, 'requestRevert', leaveRevertRequestSchema],
    ['PUT', '/:id/revert-request/action', 'LEAVE_ACTION', 'Approve or reject a leave reversal', 200, 'revertAction', leaveRevertActionSchema],
  ];
  for (const [method, path, permission, summary, status, operation, validator] of routes) {
    const schema = { tags: ['Leaves'], summary, security: [{ bearerAuth: [] }], response: { [status]: response, 401: response, 403: response, 404: response, 406: validationResponse, 500: response } };
    if (validator) schema.body = bodySchemas[operation];
    if (path.includes(':id')) schema.params = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };
    if (['/my', '/my-range', '/'].includes(path)) schema.querystring = { type: 'object', properties: { month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }, status: { type: 'string' }, search: { type: 'string' }, page: { type: 'string' }, limit: { type: 'string' }, startDate: { type: 'string', format: 'date-time' }, endDate: { type: 'string', format: 'date-time' }, employeeId: { type: 'string' } } };
    app.route({ method, url: `/api/v2/leaves${path}`, schema, validatorCompiler: () => data => ({ value: data }),
      preValidation: [authenticate, async (request, reply) => {
        const denied = await authorize(permission, request);
        if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message));
      }, ...(validator ? [validate(validator)] : [])],
      handler: async (request, reply) => {
        const data = await service[operation](request);
        if (operation === 'apply') return reply.code(201).send(success(null, 'Leave applied'));
        if (operation === 'action') return reply.code(200).send(success(null, request.body.status));
        if (operation === 'requestRevert') return reply.code(200).send(success(data, 'Leave revert requested'));
        if (operation === 'revertAction') return reply.code(200).send(success(data, `Leave revert ${request.body.status}`));
        return reply.code(status).send(success(data));
      },
    });
  }
};
