import { failure } from './errors.js';
const allowed = new Set(['/me/profile','/me/permissions','/change-password/send-otp','/change-password/verify-otp','/change-password/update'].map(path => `/api/v2/users${path}`));
export const createAuthenticationHook = authenticate => async (request, reply) => {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return reply.code(401).send(failure(401, 'Authorization token missing'));
  try {
    request.user = await authenticate(header.split(' ')[1]);
    if (request.user.mustChangePassword && !allowed.has(request.routeOptions.url)) return reply.code(403).send(failure(403, 'Password change required before continuing.', null, { mustChangePassword: true }));
  } catch (error) {
    if (error.publicMessage) return reply.code(error.statusCode).send(failure(error.statusCode, error.publicMessage, error.authError || null));
    throw error;
  }
};
