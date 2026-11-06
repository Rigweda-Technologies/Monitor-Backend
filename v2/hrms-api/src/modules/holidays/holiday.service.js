export const createHolidayService = models => ({
  async create(request) {
    const holidayDate = new Date(request.body.date);
    const year = holidayDate.getFullYear();
    const exists = await models.Holiday.findOne({ organizationId: request.user.organizationId, date: holidayDate, year });
    if (exists) throw new Error('Holiday already exists for this year');
    const holiday = await models.Holiday.create({ ...request.body, date: holidayDate, year, organizationId: request.user.organizationId });
    await models.AuditLog.create({ organizationId: request.user.organizationId, userId: request.user._id || request.user.userId, module: 'holidays', action: 'CREATE', entityId: holiday._id, after: holiday.toObject(), ipAddress: request.ip, userAgent: request.headers?.['user-agent'] || '' });
    return holiday;
  },
  list: request => models.Holiday.find({ organizationId: request.user.organizationId, year: request.query.year || new Date().getFullYear() }).sort({ date: 1 }),
  async update(id, request) {
    const holiday = await models.Holiday.findOneAndUpdate({ _id: id, organizationId: request.user.organizationId }, request.body, { returnDocument: 'after' });
    if (!holiday) throw new Error('Holiday not found');
    return holiday;
  },
  async remove(id, request) {
    const holiday = await models.Holiday.findOneAndUpdate({ _id: id, organizationId: request.user.organizationId }, { isDeleted: true }, { returnDocument: 'after' });
    if (!holiday) throw new Error('Holiday not found');
    return true;
  },
});
