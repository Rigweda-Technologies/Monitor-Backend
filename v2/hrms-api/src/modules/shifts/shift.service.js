import { httpError } from '../../plugins/errors.js';

export const createShiftService = models => ({
  async create(request) {
    const payload = { organizationId: request.user.organizationId, name: request.body.name, code: String(request.body.code || '').toUpperCase(), startTime: request.body.startTime, endTime: request.body.endTime, graceMinutes: Number(request.body.graceMinutes || 0), status: request.body.status || 'active' };
    const exists = await models.Shift.findOne({ organizationId: request.user.organizationId, code: payload.code });
    if (exists) throw httpError(500, 'Shift code already exists');
    return models.Shift.create(payload);
  },
  list: request => models.Shift.find({ organizationId: request.user.organizationId }).sort({ createdAt: -1 }),
  async update(request) {
    const update = { ...request.body };
    if (update.code) {
      update.code = String(update.code).toUpperCase();
      const exists = await models.Shift.findOne({ organizationId: request.user.organizationId, code: update.code, _id: { $ne: request.params.id } });
      if (exists) throw httpError(500, 'Shift code already exists');
    }
    const shift = await models.Shift.findOneAndUpdate({ _id: request.params.id, organizationId: request.user.organizationId }, update, { returnDocument: 'after' });
    if (!shift) throw httpError(500, 'Shift not found');
    return shift;
  },
  async remove(request) {
    const shift = await models.Shift.findOne({ _id: request.params.id, organizationId: request.user.organizationId });
    if (!shift) throw httpError(500, 'Shift not found');
    if (shift.status !== 'inactive') { shift.status = 'inactive'; await shift.save(); }
    return shift;
  },
  async myShift(request) {
    const employee = await models.Employee.findOne({ userId: request.user.userId, organizationId: request.user.organizationId }).populate('shiftId');
    if (!employee) throw httpError(500, 'Employee not found');
    return employee.shiftId || null;
  },
});
