import { failure, success } from '../../plugins/errors.js';
import { validators } from './hiring.validation.js';

const envelope = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success','code','message','data','error'] };
const validationEnvelope = { type: 'object', properties: { code: { type: 'integer' }, message: { type: 'string' }, data: { type: 'null' }, error: { type: 'array' } }, required: ['code','message','data','error'], additionalProperties: false };
const idParam = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };
const interviewParams = { type: 'object', properties: { id: { type: 'string' }, interviewId: { type: 'string' } }, required: ['id','interviewId'] };
const nameField = { type: 'string', minLength: 1, maxLength: 120, pattern: '^[A-Za-z ]+$' };
const emailField = { type: 'string', format: 'email', maxLength: 254 };
const filelessCandidate = {
  jobId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }, firstName: nameField, lastName: { type: 'string', maxLength: 120 }, email: emailField, phone: { type: 'string', pattern: '^\\d{10,15}$' }, source: { type: 'string', maxLength: 80 }, resumeUrl: { type: 'string', format: 'uri' }, yearsExperience: { type: 'number', minimum: 0 }, currentLocation: { type: 'string', maxLength: 120 }, preferredLocation: { type: 'string', maxLength: 120 }, highestQualification: { type: 'string', maxLength: 120 }, specialization: { type: 'string', maxLength: 120 }, collegeName: { type: 'string', maxLength: 160 }, graduationYear: { type: ['integer','null'], minimum: 1900, maximum: 2100 }, keySkills: { type: 'array', items: { type: 'string', maxLength: 50 } }, linkedInUrl: { type: 'string', format: 'uri' }, portfolioUrl: { type: 'string', format: 'uri' }, currentCompany: { type: 'string', maxLength: 120 }, currentCTC: { type: 'number', minimum: 0 }, expectedCTC: { type: 'number', minimum: 0 }, noticePeriodDays: { type: 'integer', minimum: 0 }, futureConsideration: { type: 'boolean' }, nextFollowUpAt: { type: ['string','null'], format: 'date-time' }, stage: { type: 'string', enum: ['applied','screening','interview','offer','hired','rejected'] }, status: { type: 'string', enum: ['active','hired','rejected','talent_pool','withdrawn'] }, assignedTo: { type: ['string','null'] }, rating: { type: 'number', minimum: 0, maximum: 5 }, remarks: { type: 'string', maxLength: 2000 }, interviewNotes: { type: 'string', maxLength: 4000 },
};
const schemas = {
  createJob: { type: 'object', properties: { title: { type: 'string', minLength: 2, maxLength: 120 }, department: { type: 'string', maxLength: 120 }, employmentType: { type: 'string', enum: ['full_time','part_time','contract','internship'] }, location: { type: 'string', maxLength: 120 }, openings: { type: 'integer', minimum: 1 }, description: { type: 'string', maxLength: 5000 }, status: { type: 'string', enum: ['draft','open','on_hold','closed'] } }, required: ['title'], additionalProperties: false },
  updateJob: { type: 'object', properties: { title: { type: 'string', minLength: 2, maxLength: 120 }, department: { type: 'string', maxLength: 120 }, employmentType: { type: 'string', enum: ['full_time','part_time','contract','internship'] }, location: { type: 'string', maxLength: 120 }, openings: { type: 'integer', minimum: 1 }, description: { type: 'string', maxLength: 5000 }, status: { type: 'string', enum: ['draft','open','on_hold','closed'] }, }, additionalProperties: false },
  createCandidate: { type: 'object', properties: filelessCandidate, required: ['jobId','firstName','email'], additionalProperties: false },
  updateCandidate: { type: 'object', properties: filelessCandidate, additionalProperties: false },
  updateCandidateStage: { type: 'object', properties: { stage: { type: 'string', enum: ['applied','screening','interview','offer','hired','rejected'] }, note: { type: 'string', maxLength: 500 } }, required: ['stage'], additionalProperties: false },
  releaseOfferLetter: { type: 'object', properties: { note: { type: 'string', maxLength: 500 } }, additionalProperties: false },
  sendRejectionEmail: { type: 'object', properties: { note: { type: 'string', maxLength: 500 } }, additionalProperties: false },
  convertCandidateToEmployee: { type: 'object', properties: { password: { type: 'string', minLength: 6 }, roleIds: { type: 'array', minItems: 1, items: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } }, departmentId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }, designationId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }, employmentType: { type: 'string', enum: ['full_time','part_time','contract'] }, dateOfJoining: { type: 'string', format: 'date-time' }, managerId: { type: ['string','null'] }, shiftId: { type: ['string','null'] } }, required: ['password','roleIds','departmentId','designationId','employmentType','dateOfJoining'], additionalProperties: false },
  scheduleInterview: { type: 'object', properties: { roundName: { type: 'string', maxLength: 50 }, interviewerEmployeeId: { type: ['string','null'] }, scheduledAt: { type: 'string', format: 'date-time' }, mode: { type: 'string', enum: ['virtual','onsite','phone'] }, meetingLink: { type: 'string', format: 'uri' } }, required: ['scheduledAt'], additionalProperties: false },
  submitInterviewFeedback: { type: 'object', properties: { feedback: { type: 'string', maxLength: 4000 }, communication: { type: ['integer','null'], minimum: 1, maximum: 5 }, technical: { type: ['integer','null'], minimum: 1, maximum: 5 }, problemSolving: { type: ['integer','null'], minimum: 1, maximum: 5 }, cultureFit: { type: ['integer','null'], minimum: 1, maximum: 5 }, overall: { type: ['integer','null'], minimum: 1, maximum: 5 }, recommendation: { type: ['string','null'], enum: ['strong_hire','hire','hold','reject',null] }, status: { type: 'string', enum: ['scheduled','completed','cancelled'] } }, additionalProperties: false },
};
const querySchema = (kind) => kind === 'jobs' ? { type: 'object', properties: { status: { type: 'string', enum: ['draft','open','on_hold','closed','all'] }, search: { type: 'string' } }, additionalProperties: false } : { type: 'object', properties: { jobId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }, stage: { type: 'string', enum: ['applied','screening','interview','offer','hired','rejected','all'] }, status: { type: 'string', enum: ['active','hired','rejected','talent_pool','withdrawn','all'] }, search: { type: 'string' } }, additionalProperties: false };
const validate = (schema, part) => (request, reply, done) => {
  const { error, value } = schema.validate(request[part] ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] });
  request[part] = value; done();
};

export const registerHiringRoutes = async (app, { service, authenticate, authorize }) => {
  // Route definitions are kept explicit so the registered contract stays reviewable.
  const definitions = [
    { method: 'GET', path: '/overview', op: 'getOverview', perm: ['HIRING_VIEW','HIRING_MANAGE'], summary: 'Get hiring overview', message: 'Hiring overview fetched successfully' },
    { method: 'GET', path: '/employees', op: 'listEmployees', perm: ['HIRING_VIEW','HIRING_MANAGE'], summary: 'List hiring employees', message: 'Employees fetched successfully' },
    { method: 'POST', path: '/jobs', op: 'createJob', perm: 'HIRING_MANAGE', validator: 'createJob', summary: 'Create a hiring job', message: 'Job created successfully', status: 201 },
    { method: 'GET', path: '/jobs', op: 'listJobs', perm: ['HIRING_VIEW','HIRING_MANAGE'], query: 'jobs', summary: 'List hiring jobs', message: 'Jobs fetched successfully' },
    { method: 'PUT', path: '/jobs/:id', op: 'updateJob', perm: 'HIRING_MANAGE', validator: 'updateJob', params: idParam, summary: 'Update a hiring job', message: 'Job updated successfully' },
    { method: 'DELETE', path: '/jobs/:id', op: 'removeJob', perm: 'HIRING_MANAGE', params: idParam, summary: 'Delete a hiring job', message: 'Job deleted successfully', empty: true },
    { method: 'POST', path: '/candidates', op: 'createCandidate', perm: 'HIRING_MANAGE', validator: 'createCandidate', summary: 'Create a hiring candidate', message: 'Candidate created successfully', status: 201 },
    { method: 'GET', path: '/candidates', op: 'listCandidates', perm: ['HIRING_VIEW','HIRING_MANAGE'], query: 'candidates', summary: 'List hiring candidates', message: 'Candidates fetched successfully' },
    { method: 'PUT', path: '/candidates/:id', op: 'updateCandidate', perm: 'HIRING_MANAGE', validator: 'updateCandidate', params: idParam, summary: 'Update a hiring candidate', message: 'Candidate updated successfully' },
    { method: 'PUT', path: '/candidates/:id/stage', op: 'updateCandidateStage', perm: 'HIRING_MANAGE', validator: 'updateCandidateStage', params: idParam, summary: 'Update candidate stage', message: 'Candidate stage updated successfully' },
    { method: 'POST', path: '/candidates/:id/release-offer-letter', op: 'releaseOfferLetter', perm: 'HIRING_MANAGE', validator: 'releaseOfferLetter', params: idParam, summary: 'Release candidate offer letter', message: 'Offer letter released successfully' },
    { method: 'POST', path: '/candidates/:id/send-rejection-email', op: 'sendRejectionEmail', perm: 'HIRING_MANAGE', validator: 'sendRejectionEmail', params: idParam, summary: 'Send candidate rejection email', message: 'Rejection email sent successfully' },
    { method: 'POST', path: '/candidates/:id/convert-to-employee', op: 'convertCandidateToEmployee', perm: 'HIRING_MANAGE', validator: 'convertCandidateToEmployee', params: idParam, summary: 'Convert hired candidate to employee', message: 'Candidate converted to employee successfully' },
    { method: 'POST', path: '/candidates/:id/interviews', op: 'scheduleInterview', perm: 'HIRING_MANAGE', validator: 'scheduleInterview', params: idParam, summary: 'Schedule a candidate interview', message: 'Interview scheduled successfully' },
    { method: 'PUT', path: '/candidates/:id/interviews/:interviewId/feedback', op: 'submitInterviewFeedback', perm: 'HIRING_MANAGE', validator: 'submitInterviewFeedback', params: interviewParams, summary: 'Submit interview feedback', message: 'Interview feedback submitted successfully' },
    { method: 'DELETE', path: '/candidates/:id', op: 'removeCandidate', perm: 'HIRING_MANAGE', params: idParam, summary: 'Delete a hiring candidate', message: 'Candidate deleted successfully', empty: true },
  ];
  for (const route of definitions) {
    const status = route.status || 200;
    const schema = { tags: ['Hiring'], summary: route.summary, security: [{ bearerAuth: [] }], response: { [status]: envelope, 401: envelope, 403: envelope, 404: envelope, 406: validationEnvelope, 409: envelope, 500: envelope } };
    if (route.validator) schema.body = schemas[route.validator];
    if (route.query) schema.querystring = querySchema(route.query);
    if (route.params) schema.params = route.params;
    app.route({ method: route.method, url: `/api/v2/hiring${route.path}`, schema, validatorCompiler: () => data => ({ value: data }), preValidation: [authenticate, async (request, reply) => { const denied = await authorize(route.perm, request); if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message)); }, ...(route.validator ? [validate(validators[route.validator], 'body')] : []), ...(route.query ? [validate(validators[route.query === 'jobs' ? 'listJobs' : 'listCandidates'], 'query')] : [])], handler: async (request, reply) => { const result = await service[route.op](request); return reply.code(status).send(success(route.empty ? null : result, route.message)); } });
  }
};
