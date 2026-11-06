import { validators } from './auth.validation.js';
import { authSchema } from './auth.schemas.js';
import { createAuthController } from './auth.controller.js';
export const authRoutes = [
  ['POST','/login','login','loginSchema','login','login',false,true,'Sign in with password'],
  ['POST','/login/selfie','loginWithSelfie','loginWithSelfieSchema','selfie','selfie',false,true,'Sign in with password and selfie'],
  ['POST','/switch-org','switchOrganization','switchOrgSchema','switch','switch',true,false,'Switch active organization'],
  ['GET','/me/profile','profile',null,null,'profile',true,false,'Get current user profile'],
  ['GET','/me/permissions','permissions',null,null,'permissions',true,false,'Get active role permissions'],
  ['POST','/send-otp','sendOtp','sendOTPUserSchema','email','empty',false,true,'Send verification OTP'],
  ['POST','/verify-otp','verifyOtp','validateOTPSchema','otp','empty',false,true,'Verify OTP'],
  ['POST','/forgot-password/send-otp','sendOtp','sendOTPUserSchema','email','empty',false,true,'Send password reset OTP'],
  ['POST','/forgot-password/verify-otp','verifyResetOtp','validateOTPSchema','otp','empty',false,true,'Verify password reset OTP'],
  ['POST','/forgot-password/reset-password','reset','resetPasswordSchema','reset','empty',false,true,'Reset password after OTP verification'],
  ['POST','/change-password/send-otp','sendChangeOtp',null,null,'empty',true,true,'Send password change OTP'],
  ['POST','/change-password/verify-otp','verifyChangeOtp','verifyOtpOnlySchema','verifyChange','empty',true,true,'Verify password change OTP'],
  ['POST','/change-password/update','change','updatePasswordAuthSchema','change','empty',true,true,'Change password after OTP verification'],
];
const validate = validator => async (request, reply) => {
  const { error, value } = validator.validate(request.body ?? {}, { abortEarly: true });
  if (error) return reply.code(406).send({ code: 406, message: error.details[0].message, data: null, error: [] });
  request.body = value;
};
export const registerAuthRoutes = async (app, { service, authenticate, publicLimiter }) => {
  const controllers = createAuthController(service);
  for (const [method,path,handler,validator,body,result,protectedRoute,limited,summary] of authRoutes) {
    app.route({ method, url: `/api/v2/users${path}`, schema: authSchema({ summary, body, result, protectedRoute }),
      // Joi remains authoritative to preserve v1 coercion, first error and 406 response.
      validatorCompiler: () => data => ({ value: data }),
      preValidation: [...(protectedRoute ? [authenticate] : []), ...(limited ? [publicLimiter] : []), ...(validator ? [validate(validators[validator])] : [])],
      handler: controllers[handler],
    });
  }
};
