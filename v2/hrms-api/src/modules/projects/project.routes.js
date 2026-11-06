import { failure, success } from '../../plugins/errors.js';
import { createProjectSchema, updateProjectSchema, listProjectsQuerySchema } from './project.validation.js';

const envelope = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const validationEnvelope = { type: 'object', properties: { code: { type: 'integer' }, message: { type: 'string' }, data: { type: 'null' }, error: { type: 'array' } }, required: ['code','message','data','error'], additionalProperties: false };
const projectProperties = {
  projectName: { type: 'string', minLength: 2, maxLength: 120 }, logoUrl: { type: 'string', format: 'uri' }, clientName: { type: 'string', minLength: 2, maxLength: 120, pattern: '^[A-Za-z ]+$' }, clientCompany: { type: 'string', maxLength: 120 }, clientEmail: { type: 'string', format: 'email', maxLength: 254 }, clientPhone: { type: 'string', pattern: '^\\d{10,15}$' }, clientAddress: { type: 'string', maxLength: 500 }, actualAmount: { type: 'number', minimum: 0 }, discountedAmount: { type: 'number', minimum: 0 }, paidAmount: { type: 'number', minimum: 0 }, paidTo: { type: ['string','null'], pattern: '^[a-fA-F0-9]{24}$' }, status: { type: 'string', enum: ['active','on_hold','completed','cancelled'] }, startDate: { type: ['string','null'], format: 'date-time' }, expectedEndDate: { type: ['string','null'], format: 'date-time' }, notes: { type: 'string', maxLength: 1000 }, mouUpload: { $ref: '#/components/schemas/ProjectUpload' }, documentationUpload: { $ref: '#/components/schemas/ProjectUpload' },
};
const uploadDefinition = { type: 'object', properties: { fileName: { type: 'string' }, mimeType: { type: 'string' }, base64Data: { type: 'string' } }, required: ['fileName','mimeType','base64Data'], additionalProperties: false };
const validate = schema => (request, reply, done) => {
  const { error, value } = schema.validate(request[request.method === 'GET' ? 'query' : 'body'] ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] });
  if (request.method === 'GET') request.query = value;
  else request.body = value;
  done();
};

export const registerProjectRoutes = async (app, { service, authenticate, authorize }) => {
  app.addSchema({ $id: 'ProjectUpload', ...uploadDefinition });
  const routes = [
    { method: 'POST', path: '/', permission: 'PROJECT_MANAGE', summary: 'Create a project', operation: 'create', status: 201, message: 'Project created successfully', validator: createProjectSchema, body: { type: 'object', properties: projectProperties, required: ['projectName','clientName','actualAmount','discountedAmount','paidTo'], additionalProperties: false } },
    { method: 'GET', path: '/', permission: ['PROJECT_VIEW','PROJECT_MANAGE'], summary: 'List projects', operation: 'list', status: 200, message: 'Projects fetched successfully', validator: listProjectsQuerySchema, querystring: { type: 'object', properties: { status: { type: 'string', enum: ['active','on_hold','completed','cancelled','all'] }, search: { type: 'string' } }, additionalProperties: false } },
    { method: 'GET', path: '/employees', permission: ['PROJECT_VIEW','PROJECT_MANAGE'], summary: 'List employees available for projects', operation: 'listEmployees', status: 200, message: 'Employees fetched successfully' },
    { method: 'GET', path: '/:id', permission: ['PROJECT_VIEW','PROJECT_MANAGE'], summary: 'Get a project', operation: 'getById', status: 200, message: 'Project fetched successfully', params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { method: 'PUT', path: '/:id', permission: 'PROJECT_MANAGE', summary: 'Update a project', operation: 'update', status: 200, message: 'Project updated successfully', validator: updateProjectSchema, body: { type: 'object', properties: projectProperties, additionalProperties: false }, params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { method: 'DELETE', path: '/:id', permission: 'PROJECT_MANAGE', summary: 'Delete a project', operation: 'remove', status: 200, message: 'Project deleted successfully', params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  ];
  for (const route of routes) {
    const schema = { tags: ['Projects'], summary: route.summary, security: [{ bearerAuth: [] }], response: { [route.status]: envelope, 401: envelope, 403: envelope, 406: validationEnvelope, 500: envelope } };
    if (route.body) schema.body = route.body;
    if (route.querystring) schema.querystring = route.querystring;
    if (route.params) schema.params = route.params;
    app.route({ method: route.method, url: `/api/v2/projects${route.path}`, schema, validatorCompiler: () => data => ({ value: data }), preValidation: [authenticate, async (request, reply) => { const denied = await authorize(route.permission, request); if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message)); }, ...(route.validator ? [validate(route.validator)] : [])], handler: async (request, reply) => reply.code(route.status).send(success(await service[route.operation](request), route.message)) });
  }
};
