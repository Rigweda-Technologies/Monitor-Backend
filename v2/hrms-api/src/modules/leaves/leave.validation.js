import Joi from 'joi';

const reasonPattern = /^(?=.*[A-Za-z])[A-Za-z\s.,'()&/-]+$/;
export const applyLeaveSchema = Joi.object({
  leaveTypeId: Joi.string().required(), fromDate: Joi.date().required(), toDate: Joi.date().required(),
  duration: Joi.string().valid('full_day', 'half_day').default('full_day'),
  halfDaySession: Joi.when('duration', { is: 'half_day', then: Joi.string().valid('first_half', 'second_half').required(), otherwise: Joi.optional().allow(null, '') }),
  reason: Joi.string().trim().min(3).max(500).pattern(reasonPattern).required().messages({
    'string.empty': 'Reason is required', 'string.min': 'Reason must be at least 3 characters', 'string.max': 'Reason must be at most 500 characters',
    'string.pattern.base': 'Reason must contain meaningful text (letters only, no numbers)',
  }),
});
export const leaveActionSchema = Joi.object({ status: Joi.string().valid('approved', 'rejected', 'cancelled').required(), rejectionReason: Joi.when('status', { is: 'rejected', then: Joi.string().min(3).required(), otherwise: Joi.optional() }) });
export const leaveRevertRequestSchema = Joi.object({ fromDate: Joi.date().required(), toDate: Joi.date().required(), reason: Joi.string().trim().max(500).allow('').optional() });
export const leaveRevertActionSchema = Joi.object({ status: Joi.string().valid('approved', 'rejected').required(), rejectionReason: Joi.when('status', { is: 'rejected', then: Joi.string().trim().min(3).required(), otherwise: Joi.optional().allow('') }) });
