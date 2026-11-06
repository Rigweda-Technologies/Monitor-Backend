import Joi from 'joi';

const date = Joi.date();
const dateKey = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const entry = Joi.object({ date: date.required(), hours: Joi.number().min(0).max(24).required(), notes: Joi.string().allow('').max(500).optional() });
const bulk = Joi.object({ date: dateKey.optional(), startDate: dateKey.optional(), endDate: dateKey.optional(), includeNonWorkingDays: Joi.boolean().default(true), status: Joi.string().valid('present', 'half_day_present', 'absent').required(), employeeIds: Joi.array().items(Joi.string().required()).min(1).required() }).custom((value, helpers) => {
  const single = Boolean(value.date); const range = Boolean(value.startDate || value.endDate);
  if (single && range) return helpers.message({ custom: 'Provide either date or startDate/endDate, not both' });
  if (!single && (!value.startDate || !value.endDate)) return helpers.message({ custom: 'Provide date or both startDate and endDate' });
  if (value.startDate && value.endDate) { const days = Math.floor((Date.parse(`${value.endDate}T00:00:00Z`) - Date.parse(`${value.startDate}T00:00:00Z`)) / 86400000) + 1; if (days < 1) return helpers.message({ custom: 'endDate must be on or after startDate' }); if (days > 30) return helpers.message({ custom: 'Bulk attendance can cover at most 30 days' }); }
  return value;
});
const customBulk = Joi.object({ updates: Joi.array().items(Joi.object({ employeeId: Joi.string().required(), date: dateKey.required(), status: Joi.string().valid('present', 'absent').required() })).min(1).max(3000).required(), includeNonWorkingDays: Joi.boolean().default(true) }).custom((value, helpers) => new Set(value.updates.map(item => item.date)).size > 30 ? helpers.message({ custom: 'Customized attendance can cover at most 30 dates' }) : value);

export const timesheetSchemas = {
  checkIn: Joi.object({ clientIp: Joi.string().trim().allow('', null), publicIp: Joi.string().trim().allow('', null), ipAddress: Joi.string().trim().allow('', null), deviceId: Joi.string().trim().allow('', null), accuracy: Joi.number().min(0), latitude: Joi.number().min(-90).max(90), longitude: Joi.number().min(-180).max(180), selfieImage: Joi.string().max(5 * 1024 * 1024).allow('') }),
  checkOut: Joi.object({ clientIp: Joi.string().trim().allow('', null), publicIp: Joi.string().trim().allow('', null), ipAddress: Joi.string().trim().allow('', null), deviceId: Joi.string().trim().allow('', null), accuracy: Joi.number().min(0), latitude: Joi.number().min(-90).max(90), longitude: Joi.number().min(-180).max(180), selfieImage: Joi.string().max(5 * 1024 * 1024).allow('') }),
  createWeekly: Joi.object({ weekStart: date.optional(), entries: Joi.array().items(entry).optional() }),
  updateWeekly: Joi.object({ entries: Joi.array().items(entry).required(), weekStart: date.optional() }),
  submitWeekly: Joi.object({ weekStart: date.optional(), entries: Joi.array().items(entry).optional() }),
  actionWeekly: Joi.object({ status: Joi.string().valid('approved', 'rejected').required(), rejectionReason: Joi.when('status', { is: 'rejected', then: Joi.string().min(3).required(), otherwise: Joi.optional() }) }),
  overrideAttendance: Joi.object({ date: date.required(), status: Joi.string().valid('present', 'half_day_present', 'absent').required() }),
  bulkOverrideAttendance: bulk,
  customBulkOverrideAttendance: customBulk,
  lockAttendanceMonth: Joi.object({ month: Joi.string().pattern(/^\d{4}-\d{2}$/).required() }),
  attendanceRequestDefaults: Joi.object({ date: dateKey.required(), requestType: Joi.string().valid('work_from_home').optional(), dayPortion: Joi.string().valid('full_day', 'first_half', 'second_half').default('full_day') }),
  raiseAttendanceRequest: Joi.object({ date: dateKey.required(), requestType: Joi.string().valid('missed_checkout', 'correction', 'work_from_home').required(), dayPortion: Joi.when('requestType', { is: 'work_from_home', then: Joi.string().valid('full_day', 'first_half', 'second_half').default('full_day'), otherwise: Joi.string().valid('full_day').default('full_day') }), requestedCheckInTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null, ''), requestedCheckOutTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null, ''), reason: Joi.string().trim().min(3).max(500).required() }),
  attendanceRequestAction: Joi.object({ status: Joi.string().valid('approved', 'rejected').required(), rejectionReason: Joi.when('status', { is: 'rejected', then: Joi.string().trim().min(3).required(), otherwise: Joi.optional() }) }),
};
