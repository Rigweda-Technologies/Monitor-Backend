export const failure = (code, message, error = null, data = null) => ({ success: false, code, message, data, error });
export const success = (data = null, message = 'Success') => ({ success: true, code: 200, message, data, error: null });
export const httpError = (code, message, data = null) => Object.assign(new Error(message), { statusCode: code, publicMessage: message, data });
export const errorHandler = (error, request, reply) => {
  if (error.publicMessage) return reply.code(error.statusCode).send(failure(error.statusCode, error.publicMessage, null, error.data));
  if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') return reply.code(413).send(failure(413, 'request entity too large'));
  if (error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') return reply.code(415).send(failure(415, 'unsupported content type'));
  request.log.error({ requestId: request.id, name: error.name }, 'Request failed');
  return reply.code(500).send(failure(500, 'Something went wrong'));
};
