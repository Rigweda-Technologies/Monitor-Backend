import Joi from 'joi';

const NAME_REGEX = /^[A-Za-z ]+$/;
const phone = Joi.string().trim().pattern(/^\d{10,15}$/).allow('').messages({ 'string.pattern.base': 'Phone must be 10-15 digits' });
const name = ({ required = false, allowEmpty = false } = {}) => {
  let schema = Joi.string().trim().min(2).max(120).pattern(NAME_REGEX).messages({ 'string.pattern.base': 'Only letters and spaces are allowed' });
  if (allowEmpty) schema = schema.allow('');
  return required ? schema.required() : schema.optional();
};
const email = Joi.string().trim().lowercase().email().max(254).allow('');
const file = Joi.object({ fileName: Joi.string().required(), mimeType: Joi.string().required(), base64Data: Joi.string().required() });
const objectId = Joi.string().hex().length(24);
export const createProjectSchema = Joi.object({
  projectName: Joi.string().trim().min(2).max(120).required(), logoUrl: Joi.string().uri().allow('').optional(), clientName: name({ required: true }), clientCompany: Joi.string().trim().max(120).allow('').optional(), clientEmail: email.optional(), clientPhone: phone.optional(), clientAddress: Joi.string().trim().max(500).allow('').optional(), actualAmount: Joi.number().min(0).required(), discountedAmount: Joi.number().min(0).required(), paidAmount: Joi.number().min(0).optional(), paidTo: objectId.required(), status: Joi.string().valid('active','on_hold','completed','cancelled').optional(), startDate: Joi.date().allow(null).optional(), expectedEndDate: Joi.date().allow(null).optional(), notes: Joi.string().trim().max(1000).allow('').optional(), mouUpload: file.optional(), documentationUpload: file.optional(),
});
export const updateProjectSchema = Joi.object({
  projectName: Joi.string().trim().min(2).max(120).optional(), logoUrl: Joi.string().uri().allow('').optional(), clientName: name(), clientCompany: Joi.string().trim().max(120).allow('').optional(), clientEmail: email.optional(), clientPhone: phone.optional(), clientAddress: Joi.string().trim().max(500).allow('').optional(), actualAmount: Joi.number().min(0).optional(), discountedAmount: Joi.number().min(0).optional(), paidAmount: Joi.number().min(0).optional(), paidTo: objectId.allow(null, '').optional(), status: Joi.string().valid('active','on_hold','completed','cancelled').optional(), startDate: Joi.date().allow(null).optional(), expectedEndDate: Joi.date().allow(null).optional(), notes: Joi.string().trim().max(1000).allow('').optional(), mouUpload: file.optional(), documentationUpload: file.optional(),
});
export const listProjectsQuerySchema = Joi.object({ status: Joi.string().valid('active','on_hold','completed','cancelled','all').optional(), search: Joi.string().trim().allow('').optional() });
