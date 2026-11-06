import { httpError } from '../../plugins/errors.js';

const roundTwo = value => Math.round(Number(value) * 100) / 100;
const roundHalf = value => roundTwo(Math.round(Number(value || 0) * 2) / 2);
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createLeaveBalanceService = models => {
  const resolveLeaveType = async ({ organizationId, leaveTypeId, leaveTypeName }) => {
    if (leaveTypeId) { const byId = await models.LeaveType.findOne({ _id: leaveTypeId, organizationId }).select('_id name code'); if (byId) return byId; }
    const normalized = String(leaveTypeName || '').trim(); if (!normalized) return null;
    const exact = await models.LeaveType.findOne({ organizationId, name: normalized }).select('_id name code'); if (exact) return exact;
    const match = normalized.match(/^(.*?)(?:\s*\(([^)]+)\))?$/); const name = match?.[1]?.trim() || ''; const code = match?.[2]?.trim() || '';
    if (code) { const byCode = await models.LeaveType.findOne({ organizationId, code: new RegExp(`^${escapeRegex(code)}$`, 'i') }).select('_id name code'); if (byCode) return byCode; }
    if (name) return models.LeaveType.findOne({ organizationId, name: new RegExp(`^${escapeRegex(name)}$`, 'i') }).select('_id name code');
    return null;
  };
  const audit = (request, balance, before) => models.AuditLog.create({ organizationId: request.user.organizationId, userId: request.user._id || request.user.userId, module: 'leave_balances', action: 'UPDATE', entityId: balance._id, before, after: balance.toObject(), ipAddress: request.ip, userAgent: request.headers?.['user-agent'] || '' });
  const adjustmentResult = (employee, leaveType, balance, days) => ({
    employee: { _id: employee._id, name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employeeCode || 'Employee', employeeCode: employee.employeeCode || '' },
    leaveType: { _id: leaveType._id, name: leaveType.name, code: leaveType.code },
    balance: { _id: balance._id, total: balance.total, used: balance.used, pending: balance.pending || 0, remaining: balance.remaining, cycleStartYear: balance.cycleStartYear },
    adjustmentDays: days,
  });
  const applyAdjustment = async (request, employee, leaveType, balance, days, suffix = '') => {
    const usedAndPending = roundTwo(Number(balance.used || 0) + Number(balance.pending || 0));
    const nextRemaining = roundTwo(days - usedAndPending);
    if (days < usedAndPending) throw httpError(400, `Configured total cannot be less than used + pending (${usedAndPending})${suffix}`);
    if (nextRemaining < 0) throw httpError(400, `Adjusted remaining leave cannot be negative${suffix}`);
    const before = balance.toObject(); balance.total = days; balance.remaining = nextRemaining; await balance.save(); await audit(request, balance, before);
    return adjustmentResult(employee, leaveType, balance, days);
  };
  return {
    async getMy(request) {
      const employee = await models.Employee.findOne({ organizationId: request.user.organizationId, userId: request.user.userId });
      if (!employee) throw httpError(500, 'Employee not found');
      const balances = await models.LeaveBalance.find({ organizationId: request.user.organizationId, employeeId: employee._id }).populate('leaveTypeId', 'name code status');
      await Promise.all(balances.map(async balance => { const total = roundHalf(balance.total); const used = roundHalf(balance.used); const pending = roundHalf(balance.pending || 0); const remaining = roundHalf(total - used - pending); if (balance.total !== total || balance.used !== used || (balance.pending || 0) !== pending || balance.remaining !== remaining) { balance.total = total; balance.used = used; balance.pending = pending; balance.remaining = remaining; await balance.save(); } }));
      return balances.filter(balance => balance.leaveTypeId && balance.leaveTypeId.status !== 'inactive').map(balance => ({ _id: balance._id, leaveTypeId: balance.leaveTypeId._id, leaveType: balance.leaveTypeId.name, code: balance.leaveTypeId.code, status: balance.leaveTypeId.status, total: balance.total, used: balance.used, pending: balance.pending || 0, remaining: balance.remaining }));
    },
    async getEmployee(request) {
      if (request.user.activeRoleId) {
        const role = await models.Role.findOne({ _id: request.user.activeRoleId, organizationId: request.user.organizationId }).select('slug');
        if (role?.slug === 'manager') {
          const manager = await models.Employee.findOne({ userId: request.user.userId, organizationId: request.user.organizationId }).select('_id');
          if (manager) { const reports = await models.Employee.find({ organizationId: request.user.organizationId, managerId: manager._id }).distinct('_id'); if (!reports.some(id => id.toString() === request.params.employeeId.toString())) throw httpError(500, 'Access denied'); }
        }
      }
      const employee = await models.Employee.findOne({ _id: request.params.employeeId, organizationId: request.user.organizationId });
      if (!employee) throw httpError(500, 'Employee not found');
      const balances = await models.LeaveBalance.find({ organizationId: request.user.organizationId, employeeId: employee._id }).populate('leaveTypeId', 'name code status');
      return balances.filter(balance => balance.leaveTypeId).map(balance => ({ _id: balance._id, leaveTypeId: balance.leaveTypeId._id, leaveType: balance.leaveTypeId.name, code: balance.leaveTypeId.code, status: balance.leaveTypeId.status, total: balance.total, used: balance.used, pending: balance.pending || 0, remaining: balance.remaining }));
    },
    async adjustEmployee(request) {
      const { organizationId } = request.user; const employee = await models.Employee.findOne({ _id: request.params.employeeId, organizationId }).select('_id firstName lastName employeeCode');
      if (!employee) throw httpError(404, 'Employee not found');
      const { balanceId, leaveTypeId, leaveTypeName } = request.body; let balance = null; let leaveType = null;
      if (balanceId) { balance = await models.LeaveBalance.findOne({ _id: balanceId, organizationId, employeeId: employee._id }).populate('leaveTypeId', 'name code').sort({ cycleStartYear: -1 }); if (balance?.leaveTypeId) leaveType = balance.leaveTypeId; }
      if (!leaveType) leaveType = await resolveLeaveType({ organizationId, leaveTypeId, leaveTypeName });
      if (!leaveType) throw httpError(404, 'Leave type not found');
      if (!balance) balance = await models.LeaveBalance.findOne({ organizationId, employeeId: employee._id, leaveTypeId: leaveType._id }).sort({ cycleStartYear: -1 });
      if (!balance) throw httpError(404, 'Leave balance not found for the selected employee and leave type');
      return applyAdjustment(request, employee, leaveType, balance, roundTwo(request.body.days));
    },
    async adjustAll(request) {
      const { organizationId } = request.user; const leaveType = await resolveLeaveType({ organizationId, ...request.body });
      if (!leaveType) throw httpError(404, 'Leave type not found');
      const balances = await models.LeaveBalance.find({ organizationId, leaveTypeId: leaveType._id }).sort({ cycleStartYear: -1 });
      if (!balances.length) throw httpError(404, 'No leave balances found for the selected leave type');
      const employees = await models.Employee.find({ _id: { $in: [...new Set(balances.map(balance => String(balance.employeeId)))] }, organizationId }).select('_id firstName lastName employeeCode');
      const employeeMap = new Map(employees.map(employee => [String(employee._id), employee])); const days = roundTwo(request.body.days); const items = [];
      for (const balance of balances) { const employee = employeeMap.get(String(balance.employeeId)); if (!employee) continue; const suffix = ` for ${employee.employeeCode || employee.firstName || 'an employee'}`; items.push(await applyAdjustment(request, employee, leaveType, balance, days, suffix)); }
      return { leaveType: { _id: leaveType._id, name: leaveType.name, code: leaveType.code }, count: items.length, items };
    },
  };
};
