const cycleYear = (date, startMonth) => date.getMonth() + 1 < startMonth ? date.getFullYear() - 1 : date.getFullYear();
const roundTwo = value => Math.round(value * 100) / 100;
const roundHalfDay = value => roundTwo(Math.round(Number(value || 0) * 2) / 2);
const cycleStartDate = (date, startMonth) => {
  const current = new Date(date);
  const year = current.getMonth() + 1 < startMonth ? current.getFullYear() - 1 : current.getFullYear();
  return new Date(year, startMonth - 1, 1);
};
const monthsBetween = (from, to) => (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
const periodInfo = (date, frequency, startMonth) => {
  const current = new Date(date); current.setHours(0,0,0,0);
  if (frequency === 'monthly') return { periodStart: new Date(current.getFullYear(), current.getMonth(), 1), periodsPerYear: 12 };
  const cycleStart = cycleStartDate(current, startMonth);
  if (frequency === 'yearly') return { periodStart: cycleStart, periodsPerYear: 1 };
  const quarter = Math.floor(monthsBetween(cycleStart, current) / 3);
  return { periodStart: new Date(cycleStart.getFullYear(), cycleStart.getMonth() + quarter * 3, 1), periodsPerYear: 4 };
};
const remainingPeriods = (date, frequency, startMonth) => {
  const cycleStart = cycleStartDate(date, startMonth);
  const cycleEnd = new Date(cycleStart.getFullYear() + 1, cycleStart.getMonth(), 0);
  if (frequency === 'quarterly') {
    const { periodStart } = periodInfo(date, frequency, startMonth);
    return { remaining: Math.ceil((monthsBetween(periodStart, cycleEnd) + 1) / 3), total: 4 };
  }
  return { remaining: monthsBetween(date, cycleEnd) + 1, total: 12 };
};

export const createLeaveTypeService = models => {
  const initializeBalances = async (leaveType, organizationId) => {
    const organization = await models.Organization.findById(organizationId);
    if (!organization) return;
    const settings = await models.Settings.findOne({ organizationId });
    const frequency = settings?.leaveCreditFrequency || 'monthly';
    const creditMode = settings?.leaveTypeCreditMode || 'current_month_onwards';
    const now = new Date();
    const employees = await models.Employee.find({ organizationId, isDeleted: false });
    if (!employees.length) return;
    const operations = employees.map(employee => {
      const joined = new Date(employee.dateOfJoining || now);
      const referenceDate = creditMode === 'full_year' ? now : (joined > now ? joined : now);
      const startMonth = organization.leaveCycleStartMonth;
      const startYear = cycleYear(referenceDate, startMonth);
      const { periodStart, periodsPerYear } = periodInfo(referenceDate, frequency, startMonth);
      const { remaining, total: totalPeriods } = remainingPeriods(referenceDate, frequency, startMonth);
      let total = roundHalfDay(leaveType.daysPerYear);
      if (creditMode === 'current_month_onwards') {
        total = (leaveType.daysPerYear / periodsPerYear) * remaining;
        if (frequency === 'yearly') total = (leaveType.daysPerYear / totalPeriods) * remaining;
        total = roundHalfDay(total);
      }
      return { updateOne: {
        filter: { organizationId, employeeId: employee._id, leaveTypeId: leaveType._id, cycleStartYear: startYear },
        update: { $setOnInsert: { total, used: 0, pending: 0, remaining: total, lastCreditedAt: periodStart } }, upsert: true,
      } };
    });
    await models.LeaveBalance.bulkWrite(operations);
  };
  return {
    async initializeForEmployee(employee, organizationId) {
      const organization = await models.Organization.findById(organizationId);
      if (!organization) return;
      const settings = await models.Settings.findOne({ organizationId });
      const frequency = settings?.leaveCreditFrequency || 'monthly';
      const dateOfJoining = new Date(employee.dateOfJoining);
      const startYear = cycleYear(dateOfJoining, organization.leaveCycleStartMonth);
      const { periodStart, periodsPerYear } = periodInfo(dateOfJoining, frequency, organization.leaveCycleStartMonth);
      const { remaining, total: totalPeriods } = remainingPeriods(dateOfJoining, frequency, organization.leaveCycleStartMonth);
      const leaveTypes = await models.LeaveType.find({ organizationId, status: 'active' });
      if (!leaveTypes.length) return;
      const operations = leaveTypes.map(leaveType => {
        const creditPerPeriod = Number(leaveType.daysPerYear || 0) / periodsPerYear;
        let total = creditPerPeriod * remaining;
        if (frequency === 'yearly') total = (Number(leaveType.daysPerYear || 0) / totalPeriods) * remaining;
        if (frequency === 'monthly' && dateOfJoining.getDate() > 15) total -= creditPerPeriod / 2;
        total = roundHalfDay(total);
        return { updateOne: { filter: { organizationId, employeeId: employee._id, leaveTypeId: leaveType._id, cycleStartYear: startYear }, update: { $setOnInsert: { total, used: 0, pending: 0, remaining: total, lastCreditedAt: periodStart } }, upsert: true } };
      });
      await models.LeaveBalance.bulkWrite(operations);
    },
    async create(request) {
      const { name, code, description, daysPerYear, isCarryForward, includeInPayroll, maxCarryForward, status } = request.body;
      const organizationId = request.user.organizationId;
      if (await models.LeaveType.findOne({ organizationId, code })) throw Object.assign(new Error('Leave type code already exists for this org'), { code: 400 });
      const leaveType = await models.LeaveType.create({ name, code, description, daysPerYear, isCarryForward, includeInPayroll, maxCarryForward: isCarryForward ? maxCarryForward ?? null : null, status, organizationId });
      await initializeBalances(leaveType, organizationId);
      return leaveType;
    },
    list: organizationId => models.LeaveType.find({ organizationId }),
    getEmployeeLeaves: request => models.LeaveType.find({ organizationId: request.user?.organizationId, status: 'active' }),
    async update(request) {
      const leaveType = await models.LeaveType.findOneAndUpdate({ _id: request.params.id, organizationId: request.user.organizationId }, request.body, { returnDocument: 'after', runValidators: true });
      if (!leaveType) throw Object.assign(new Error('Leave type not found'), { code: 404 });
      return leaveType;
    },
    async remove(request) {
      const leaveType = await models.LeaveType.findOne({ _id: request.params.id, organizationId: request.user.organizationId });
      if (!leaveType) throw Object.assign(new Error('Leave type not found'), { code: 404 });
      if (leaveType.status === 'inactive') return leaveType;
      leaveType.status = 'inactive';
      await leaveType.save();
    },
  };
};
