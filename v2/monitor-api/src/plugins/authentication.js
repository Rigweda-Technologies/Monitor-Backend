import { HttpError, MissingOrganizationIdentityError, SessionRejectedError } from "../errors.js";

export const createAuthenticateRequest = ({ verifySession }) => {
  if (typeof verifySession !== "function") throw new TypeError("verifySession must be a function.");

  return async (request, reply) => {
    const authorization = request.headers.authorization || "";
    const match = /^Bearer\s+(\S+)$/i.exec(authorization);
    if (!match) {
      return reply.code(401).send({
        success: false,
        message: "Sign in to continue.",
      });
    }

    try {
      const identity = await verifySession(match[1]);
      if (!identity || typeof identity !== "object") throw new SessionRejectedError();
      request.auth = { token: match[1], ...identity };
    } catch (error) {
      if (error instanceof HttpError) {
        return reply.code(error.statusCode).send({
          success: false,
          message: error instanceof MissingOrganizationIdentityError
            ? "An organization user session is required."
            : error.message,
        });
      }

      return reply.code(401).send({
        success: false,
        message: "Your session is invalid or expired.",
      });
    }
  };
};
