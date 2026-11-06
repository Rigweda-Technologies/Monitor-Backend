const normalizeShift = value => !value || value === 'default' || value === 'null' ? null : value;
const toShiftKey = shiftId => shiftId ? String(shiftId) : 'default';
export const createWeekOffService = models => ({
  async upsert(request) {
    const shiftId = normalizeShift(request.body.shiftId);
    return models.WeekOff.findOneAndUpdate({ organizationId: request.user.organizationId, shiftId }, { weekOffDays: request.body.weekOffDays, shiftId }, { upsert: true, returnDocument: 'after' });
  },
  async get(request) {
    const shiftId = normalizeShift(request.query.shiftId);
    if (shiftId) {
      const exact = await models.WeekOff.findOne({ organizationId: request.user.organizationId, shiftId });
      if (exact) return exact;
    }
    return models.WeekOff.findOne({ organizationId: request.user.organizationId, shiftId: null });
  },
  getAll: request => models.WeekOff.find({ organizationId: request.user.organizationId }).populate('shiftId', 'name code status').sort({ shiftId: 1, createdAt: -1 }),
  async resolveWeekOffDays({ organizationId, shiftId = null }) {
    const normalizedShiftId = normalizeShift(shiftId);
    const query = { organizationId, $or: [{ shiftId: null }] };
    if (normalizedShiftId) query.$or.unshift({ shiftId: normalizedShiftId });
    const configs = await models.WeekOff.find(query).select('shiftId weekOffDays');
    const exact = configs.find(config => config.shiftId && String(config.shiftId) === String(normalizedShiftId));
    if (exact) return exact.weekOffDays || [];
    const fallback = configs.find(config => !config.shiftId);
    return fallback?.weekOffDays || [];
  },
  async resolveWeekOffMapForEmployees({ organizationId, employees = [] }) {
    const configs = await models.WeekOff.find({ organizationId }).select('shiftId weekOffDays');
    const defaultDays = configs.find(config => !config.shiftId)?.weekOffDays || [];
    const byShift = new Map(configs.filter(config => config.shiftId).map(config => [toShiftKey(config.shiftId), config.weekOffDays || []]));
    const employeeMap = new Map();
    for (const employee of employees) employeeMap.set(String(employee._id), byShift.get(toShiftKey(employee.shiftId)) || defaultDays);
    return { defaultDays, employeeMap };
  },
});
