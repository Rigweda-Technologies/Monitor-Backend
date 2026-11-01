import Joi from 'joi';
const buildEmailSchema = ({ required = false } = {}) => { const schema = Joi.string().trim().lowercase().email().max(254); return required ? schema.required() : schema.optional(); };

export const validators = {};

validators.switchOrgSchema = Joi.object({
  organizationId: Joi.string().required()
});

validators.loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required(),
  password: Joi.string().required()
})
  .required()
  .messages({
    "any.required": "Email and password are required",
  });

validators.loginWithSelfieSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required(),
  password: Joi.string().required(),
  selfieImage: Joi.string().trim().min(32).required(),
  livenessSelfieImage: Joi.string().trim().min(32).required()
})
  .required()
  .messages({
    "any.required": "Email, password and selfie image are required",
  });

validators.switchOrgSchema = Joi.object({
  organizationId: Joi.string().required(),
  // roleId: Joi.string().optional()
});

validators.sendOTPUserSchema = Joi.object({
  email: buildEmailSchema({ required: true })
});

validators.validateOTPSchema = Joi.object({
  email: buildEmailSchema({ required: true }),

  otp: Joi.string()
    .length(6)
    .required()
});

validators.resetPasswordSchema = Joi.object({
  email: buildEmailSchema({ required: true }),
  password: Joi.string()
    .min(6)
    .required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Confirm password must match password"
    })
});

validators.verifyOtpOnlySchema = Joi.object({
  otp: Joi.string()
    .length(6)
    .required()
});

validators.updatePasswordAuthSchema = Joi.object({
  password: Joi.string()
    .min(6)
    .required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Confirm password must match password"
    })
});
