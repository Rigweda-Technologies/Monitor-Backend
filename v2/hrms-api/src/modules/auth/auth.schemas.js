const string = { type: 'string' };
const nullableString = { type: ['string', 'null'] };
const entity = { type: 'object', additionalProperties: true, properties: { _id: string } };
export const envelope = data => ({ type: 'object', required: ['success','code','message','data','error'], properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: string, data, error: {} } });
const input = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, required, properties });
const email = { type: 'string', format: 'email', maxLength: 254 };
const passwords = { password: { type: 'string', minLength: 6 }, confirmPassword: { type: 'string', description: 'Must equal password.' } };
const otp = { type: 'string', minLength: 6, maxLength: 6 };
export const bodies = {
  login: input({ email: { ...email, maxLength: 255 }, password: string }),
  selfie: input({ email: { ...email, maxLength: 255 }, password: string, selfieImage: { type: 'string', minLength: 32 }, livenessSelfieImage: { type: 'string', minLength: 32 } }),
  switch: input({ organizationId: string }), email: input({ email }), otp: input({ email, otp }),
  reset: input({ email, ...passwords }), verifyChange: input({ otp }), change: input(passwords),
};
const loginData = {
  type: 'object', required: ['userId','organization','roles','activeRole','mustChangePassword'],
  properties: { userId: string, organization: entity, roles: { type: 'array', items: entity }, activeRole: { ...entity, type: ['object','null'] }, mustChangePassword: { type: 'boolean' } },
};
export const results = {
  login: loginData,
  selfie: { ...loginData, properties: { ...loginData.properties, selfieVerificationBypassed: { type: 'boolean' }, selfieVerificationBypassReason: nullableString, faceMatchConfidence: { type: ['number','null'] } } },
  switch: { type: 'object', properties: { organizationId: string, activeRoleId: string, roles: { type: 'array', items: entity } } },
  profile: { type: 'object', properties: { ...Object.fromEntries(['email','employeeId','firstName','lastName','employeeCode','managerId','profileImage'].map(key => [key, nullableString])), mustChangePassword: { type: 'boolean' } } },
  permissions: { type: 'array', items: string }, empty: { type: 'null' },
};
export const authSchema = ({ summary, body, result = 'empty', protectedRoute = false }) => ({
  summary, tags: ['Authentication'], security: protectedRoute ? [{ bearerAuth: [] }] : [],
  ...(body ? { body: bodies[body] } : {}),
  response: {
    200: { ...envelope(results[result]), ...(['login','selfie','switch'].includes(result) ? { headers: { Authorization: { type: 'string', description: 'Session JWT, returned without a Bearer prefix.' } } } : {}) },
    ...Object.fromEntries([400,401,403,404,429,500,502,503].map(code => [code, envelope({})])),
    429: { oneOf: [envelope({}), { type: 'object', properties: { code: { type: 'integer' }, message: string, data: { type: 'null' }, error: { type: 'null' } } }, { type: 'string' }] },
    406: { type: 'object', required: ['code','message','data','error'], properties: { code: { type: 'integer', const: 406 }, message: string, data: { type: 'null' }, error: { type: 'array' } } },
  },
});
