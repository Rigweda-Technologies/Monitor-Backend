import { httpError } from '../../plugins/errors.js';

const positiveInt = (value, fallback) => { const n = Number(value); return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback; };
const plain = value => value?.toObject ? value.toObject() : value;
const startOfDateInZone = (key, timeZone) => {
  const midnight = Date.parse(`${key}T00:00:00.000Z`);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(midnight));
  const part = type => Number(parts.find(item => item.type === type)?.value || 0);
  const representedUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'));
  return new Date(midnight - (representedUtc - midnight));
};
const endOfDateInZone = (key, timeZone) => { const next = new Date(`${key}T00:00:00.000Z`); next.setUTCDate(next.getUTCDate() + 1); return new Date(startOfDateInZone(next.toISOString().slice(0, 10), timeZone).getTime() - 1); };
const dateKeyInZone = (value, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const part = type => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

// Policies and cross-cutting effects are injected so this module never imports the v1 runtime.
export const createLeaveService = (models, { resolvePolicy, resolveApproval, authorizeAction = async () => { throw httpError(500, 'Unable to verify leave approver access'); }, progressApproval, repairApproval = async leave => leave, listPendingApprovals = async () => [], scopeList = async () => { throw httpError(500, 'Unable to verify leave visibility'); }, enrichLeaves = async leaves => leaves, audit = async () => {}, notify = async () => {}, now = () => new Date() } = {}) => {
  const { Leave, Employee, LeaveType, LeaveBalance, Organization, Holiday, WeekOff, Settings, ApprovalFlow, User } = models;
  const actorDisplayName = (employee, fallback = '') => {
    const fullName = `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim();
    if (fullName) return employee?.employeeCode ? `${fullName} (${employee.employeeCode})` : fullName;
    return fallback || 'Organization Admin';
  };
  const employeeFor = req => Employee.findOne({ userId: req.user.userId, organizationId: req.user.organizationId });
  const getOne = async (req, scope = {}) => {
    const leave = await Leave.findOne({ _id: req.params.id, organizationId: req.user.organizationId, ...scope });
    if (!leave) throw httpError(500, 'Leave not found');
    return leave;
  };
  return {
    async apply(req) {
      const employee = await employeeFor(req);
      if (!employee) throw httpError(500, 'Employee not found');
      if ((employee.employmentLifecycleStatus || 'confirmed') !== 'confirmed') throw httpError(500, 'Only confirmed employees can apply leave');
      const fromDate = new Date(req.body.fromDate); const toDate = new Date(req.body.toDate); const duration = req.body.duration || 'full_day';
      if (fromDate > toDate) throw httpError(500, 'From date cannot be greater than to date');
      if (duration === 'half_day' && fromDate.getTime() !== toDate.getTime()) throw httpError(500, 'Half-day leave must be applied for a single date');
      const overlapping = await Leave.findOne({ organizationId: req.user.organizationId, employeeId: employee._id, status: { $in: ['pending', 'approved'] }, fromDate: { $lte: toDate }, toDate: { $gte: fromDate } });
      if (overlapping) throw httpError(500, 'You already have a leave applied for these dates');
      const policy = resolvePolicy ? await resolvePolicy({ operation: 'apply', req, employee, fromDate, toDate, models }) : null;
      if (!policy?.effectiveDateKeys?.length) throw httpError(500, policy?.message || 'Leave cannot be applied only on holidays or week offs without any working day');
      const leaveType = await LeaveType.findOne({ _id: req.body.leaveTypeId, organizationId: req.user.organizationId, status: 'active' });
      if (!leaveType) throw httpError(500, 'Invalid leave type');
      const totalDays = duration === 'half_day' ? 0.5 : policy.effectiveDateKeys.length;
      if (duration === 'half_day' && policy.effectiveDateKeys.length !== 1) throw httpError(500, 'Half-day leave is not allowed on holidays or week offs');
      const org = await Organization.findById(req.user.organizationId);
      if (!org) throw httpError(500, 'Organization not found');
      const cycleStartYear = fromDate.getMonth() + 1 < org.leaveCycleStartMonth ? fromDate.getFullYear() - 1 : fromDate.getFullYear();
      const balance = await LeaveBalance.findOneAndUpdate({ organizationId: req.user.organizationId, employeeId: employee._id, leaveTypeId: req.body.leaveTypeId, cycleStartYear, remaining: { $gte: totalDays } }, { $inc: { pending: totalDays, remaining: -totalDays } }, { new: true });
      if (!balance) throw httpError(500, 'Insufficient leave balance');
      const flow = resolveApproval ? await resolveApproval({ req, employee, totalDays, models }) : { flowId: null, steps: [] };
      let leave;
      try {
        const pending = flow.steps?.find(step => step.status === 'pending');
        leave = await Leave.create({ organizationId: req.user.organizationId, employeeId: employee._id, leaveTypeId: req.body.leaveTypeId, fromDate, toDate, duration, halfDaySession: duration === 'half_day' ? req.body.halfDaySession : null, totalDays, effectiveDateKeys: policy.effectiveDateKeys, status: 'pending', reason: req.body.reason, approvalFlowId: flow.flowId || null, approvalSteps: flow.steps || [], currentApprovalStep: pending?.stepNumber || null });
      } catch (error) {
        await LeaveBalance.updateOne({ organizationId: req.user.organizationId, employeeId: employee._id, leaveTypeId: req.body.leaveTypeId, cycleStartYear }, { $inc: { pending: -totalDays, remaining: totalDays } });
        throw error;
      }
      await audit({ req, module: 'leaves', action: 'APPLY', entityId: leave._id, after: plain(leave) });
      await notify({ event: 'leave-applied', leave, employee, flow });
      return leave;
    },
    async myLeaves(req) {
      const employee = await employeeFor(req); if (!employee) throw httpError(500, 'Employee not found');
      const query = { organizationId: req.user.organizationId, employeeId: employee._id };
      if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
      if (req.query.month && /^\d{4}-\d{2}$/.test(req.query.month)) {
        const [year, month] = req.query.month.split('-').map(Number); query.fromDate = { $lte: new Date(year, month, 0, 23, 59, 59, 999) }; query.toDate = { $gte: new Date(year, month - 1, 1) };
      }
      if (req.query.search) { const ids = await LeaveType.find({ organizationId: req.user.organizationId, name: { $regex: String(req.query.search).trim(), $options: 'i' } }).distinct('_id'); query.leaveTypeId = { $in: ids }; }
      const pageRequested = req.query.page !== undefined || req.query.limit !== undefined; const page = positiveInt(req.query.page, 1); const limit = Math.min(positiveInt(req.query.limit, 10), 100);
      const base = Leave.find(query).populate('leaveTypeId', 'name code').populate('approvalFlowId', 'name moduleKey minDays maxDays').sort({ createdAt: -1 });
      if (!pageRequested) { const rows = await base; await Promise.all(rows.map(repairApproval)); return enrichLeaves(rows, req.user.organizationId, req.user.organizationTimeZone || 'UTC'); }
      const [items, total] = await Promise.all([base.skip((page - 1) * limit).limit(limit), Leave.countDocuments(query)]);
      await Promise.all(items.map(repairApproval));
      const statsQuery = { organizationId: req.user.organizationId, employeeId: employee._id };
      const today = now(); const [pending, approved, rejected, onLeaveToday] = await Promise.all([
        Leave.countDocuments({ ...statsQuery, status: 'pending' }), Leave.countDocuments({ ...statsQuery, status: 'approved' }), Leave.countDocuments({ ...statsQuery, status: 'rejected' }),
        Leave.countDocuments({ ...statsQuery, status: 'approved', fromDate: { $lte: today }, toDate: { $gte: today } }),
      ]);
      const enrichedItems = await enrichLeaves(items, req.user.organizationId, req.user.organizationTimeZone || 'UTC');
      return { items: enrichedItems, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, stats: { pending, approved, rejected, onLeaveToday } };
    },
    async myLeavesRange(req) {
      const employee = await employeeFor(req); if (!employee) throw httpError(500, 'Employee not found');
      const query = { organizationId: req.user.organizationId, employeeId: employee._id, status: 'approved' };
      if (req.query.startDate && req.query.endDate) { query.fromDate = { $lte: new Date(req.query.endDate) }; query.toDate = { $gte: new Date(req.query.startDate) }; }
      return Leave.find(query).populate('leaveTypeId', 'name code').sort({ fromDate: 1 });
    },
    async list(req) {
      const query = await scopeList(req); const statsQuery = { ...query };
      const timeZone = req.user.organizationTimeZone || 'UTC';
      if (req.query.month && /^\d{4}-\d{2}$/.test(req.query.month)) { const [year, month] = req.query.month.split('-').map(Number); query.fromDate = { $lte: new Date(year, month, 0, 23, 59, 59, 999) }; query.toDate = { $gte: new Date(year, month - 1, 1) }; statsQuery.fromDate = query.fromDate; statsQuery.toDate = query.toDate; }
      if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
      const search = String(req.query.search || '').trim();
      if (search) {
        const [employeeIds, leaveTypeIds] = await Promise.all([
          Employee.find({ organizationId: req.user.organizationId, $or: [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }, { employeeCode: { $regex: search, $options: 'i' } }] }).distinct('_id'),
          LeaveType.find({ organizationId: req.user.organizationId, name: { $regex: search, $options: 'i' } }).distinct('_id'),
        ]);
        query.$or = [{ employeeId: { $in: employeeIds } }, { leaveTypeId: { $in: leaveTypeIds } }];
      }
      const pageRequested = req.query.page !== undefined || req.query.limit !== undefined; const page = positiveInt(req.query.page, 1); const limit = Math.min(positiveInt(req.query.limit, 10), 100);
      const base = Leave.find(query).populate('employeeId', 'firstName lastName employeeCode').populate('leaveTypeId', 'name code').populate('approvalFlowId', 'name moduleKey minDays maxDays').populate('actionBy', 'firstName lastName employeeCode designationId').populate('revertRequest.requestedBy', 'firstName lastName employeeCode').populate('revertRequest.actionBy', 'firstName lastName employeeCode designationId').populate('approvalSteps.approverEmployeeId', 'firstName lastName employeeCode').populate('approvalSteps.actionBy', 'firstName lastName employeeCode designationId').sort({ createdAt: -1 });
      if (!pageRequested) { const rows = await base; await Promise.all(rows.map(repairApproval)); return enrichLeaves(rows, req.user.organizationId, timeZone); }
      const [items, total] = await Promise.all([base.skip((page - 1) * limit).limit(limit), Leave.countDocuments(query)]); await Promise.all(items.map(repairApproval));
      const [pending, approved, rejected, onLeaveToday] = await Promise.all([Leave.countDocuments({ ...statsQuery, status: 'pending' }), Leave.countDocuments({ ...statsQuery, status: 'approved' }), Leave.countDocuments({ ...statsQuery, status: 'rejected' }), Leave.countDocuments({ ...statsQuery, status: 'approved', fromDate: { $lte: now() }, toDate: { $gte: now() } })]);
      return { items: await enrichLeaves(items, req.user.organizationId, timeZone), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, stats: { pending, approved, rejected, onLeaveToday } };
    },
    async pendingMyApprovals(req) {
      return listPendingApprovals(req);
    },
    async action(req) { return this.actionLeave(req); },
    async actionLeave(req) {
      const leave = await getOne(req); const previous = leave.status;
      await authorizeAction({ req, leave, models });
      const actor = await employeeFor(req);
      const actorUser = User ? await User.findById(req.user.userId).select('email') : null;
      const actorName = actorDisplayName(actor, actorUser?.email || req.user.email || '');
      const org = await Organization.findById(leave.organizationId); const year = new Date(leave.fromDate).getMonth() + 1 < org.leaveCycleStartMonth ? new Date(leave.fromDate).getFullYear() - 1 : new Date(leave.fromDate).getFullYear();
      const balance = await LeaveBalance.findOne({ organizationId: leave.organizationId, employeeId: leave.employeeId, leaveTypeId: leave.leaveTypeId, cycleStartYear: year });
      let finalStatus = req.body.status;
      if (['approved', 'rejected'].includes(req.body.status) && leave.approvalSteps?.length) {
        if (!progressApproval) throw httpError(500, 'Approval flow cannot be progressed');
        const progress = await progressApproval({ req, leave, actor, models });
        if (!progress) throw httpError(500, 'No pending approval step found');
        leave.approvalSteps = progress.steps;
        leave.currentApprovalStep = progress.currentApprovalStep;
        finalStatus = progress.isIntermediateApproval ? 'pending' : progress.finalStatus;
      }
      if (finalStatus === 'approved') {
        if (leave.status === 'approved') throw httpError(500, 'Leave already approved'); if (!balance) throw httpError(500, 'Leave balance not found');
        if (previous === 'pending') { if ((balance.pending || 0) >= leave.totalDays) { balance.pending -= leave.totalDays; balance.used += leave.totalDays; } else { if (balance.remaining < leave.totalDays) throw httpError(500, 'Insufficient leave balance to approve'); balance.used += leave.totalDays; balance.remaining -= leave.totalDays; } }
        else { if (balance.remaining < leave.totalDays) throw httpError(500, 'Insufficient leave balance to approve'); balance.used += leave.totalDays; balance.remaining -= leave.totalDays; }
        await balance.save();
      } else if (finalStatus === 'rejected') {
        if (balance && previous === 'pending' && (balance.pending || 0) >= leave.totalDays) { balance.pending -= leave.totalDays; balance.remaining += leave.totalDays; await balance.save(); }
        else if (balance && previous === 'approved') { balance.used = Math.max(0, balance.used - leave.totalDays); balance.remaining += leave.totalDays; await balance.save(); }
        leave.rejectionReason = req.body.rejectionReason;
      } else if (finalStatus !== 'pending') throw httpError(500, 'Invalid leave action');
      leave.status = finalStatus; leave.actionBy = actor?._id; leave.actionByName = actorName; leave.actionAt = now(); await leave.save(); await notify({ event: finalStatus === 'pending' ? 'leave-pending-approval' : 'leave-action', leave, employee: actor }); return leave;
    },
    async applyContext(req) { const employee = await employeeFor(req); if (!employee) throw httpError(500, 'Employee not found'); if (!resolvePolicy) return { employeeLifecycleStatus: employee.employmentLifecycleStatus || 'confirmed', leaveRestriction: { blocked: false, reason: '' }, weekOffDays: [], weekOffConfig: { defaultWeekOffDays: [], employeeShiftId: employee.shiftId || null, employeeWeekOffDays: [], shiftConfigs: [] }, sandwichRuleEnabled: false, leaveApplyWindow: null, holidays: [], leaveTypes: await LeaveType.find({ organizationId: req.user.organizationId, status: 'active' }).select('_id name code'), balances: await LeaveBalance.find({ organizationId: req.user.organizationId, employeeId: employee._id }).populate('leaveTypeId', 'name code'), myLeaves: [] }; return resolvePolicy({ operation: 'apply-context', req, employee, models }); },
    async requestRevert(req) {
      const employee = await employeeFor(req); if (!employee) throw httpError(500, 'Employee not found');
      const leave = await Leave.findOne({ _id: req.params.id, organizationId: req.user.organizationId, employeeId: employee._id });
      if (!leave) throw httpError(500, 'Approved leave not found');
      if (leave.status !== 'approved') throw httpError(500, 'Only approved leave can be reverted');
      const timeZone = await resolvePolicy?.({ operation: 'timezone', req, leave, models }) || 'Asia/Kolkata';
      const key = value => dateKeyInZone(value, timeZone);
      if (key(leave.fromDate) <= key(now())) throw httpError(500, 'Leave revert request is allowed only before the leave start date');
      if (leave.revertRequest?.status === 'pending') throw httpError(500, 'A leave revert request is already pending for this leave');
      const original = [...(leave.effectiveDateKeys || [])].filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)).sort();
      if (!original.length) throw httpError(500, 'This leave does not have any reversible leave days');
      const from = key(req.body.fromDate); const to = key(req.body.toDate);
      if (from > to) throw httpError(500, 'Revert from date cannot be greater than revert to date');
      const selected = original.filter(value => value >= from && value <= to);
      if (!selected.length) throw httpError(500, 'Select revert dates within the approved leave days');
      const starts = selected.every((value, index) => value === original[index]);
      const ends = selected.every((value, index) => value === original[original.length - selected.length + index]);
      if (selected.length !== original.length && !starts && !ends) throw httpError(500, 'Partial leave revert is allowed only from the start or end of the approved leave');
      const revert = {
        fromDate: startOfDateInZone(selected[0], timeZone), toDate: endOfDateInZone(selected.at(-1), timeZone), effectiveDateKeys: selected,
        totalDays: leave.duration === 'half_day' && original.length === 1 ? 0.5 : selected.length, reason: String(req.body.reason || '').trim(), status: 'pending',
        requestedBy: employee._id, requestedByName: actorDisplayName(employee, req.user.email || ''), requestedAt: now(),
        actionBy: null, actionByName: null, actionAt: null, rejectionReason: '',
      };
      leave.revertRequest = revert; leave.markModified('revertRequest'); await leave.save();
      await audit({ req, module: 'leaves', action: 'REQUEST_REVERT', entityId: leave._id, after: plain(leave) });
      await notify({ event: 'leave-revert-request', leave, employee }); return leave;
    },
    async revertAction(req) {
      const leave = await getOne(req); await authorizeAction({ req, leave, models, revert: true });
      if (leave.status !== 'approved') throw httpError(500, 'Only approved leave can be reverted');
      if (!leave.revertRequest || leave.revertRequest.status !== 'pending') throw httpError(500, 'No pending leave revert request found');
      const timeZone = await resolvePolicy?.({ operation: 'timezone', req, leave, models }) || 'Asia/Kolkata';
      const key = value => dateKeyInZone(value, timeZone);
      if (key(leave.fromDate) <= key(now())) throw httpError(500, 'Leave revert request can be actioned only before the leave start date');
      const actor = await employeeFor(req); const actorName = actorDisplayName(actor, req.user.email || ''); const revert = leave.revertRequest;
      if (req.body.status === 'rejected') {
        revert.status = 'rejected'; revert.actionBy = actor?._id || null; revert.actionByName = actorName; revert.actionAt = now(); revert.rejectionReason = String(req.body.rejectionReason || '').trim();
        leave.markModified('revertRequest'); await leave.save(); return leave;
      }
      const org = await Organization.findById(leave.organizationId); const date = new Date(leave.fromDate);
      const cycleStartYear = date.getMonth() + 1 < org.leaveCycleStartMonth ? date.getFullYear() - 1 : date.getFullYear();
      const balance = await LeaveBalance.findOne({ organizationId: leave.organizationId, employeeId: leave.employeeId, leaveTypeId: leave.leaveTypeId, cycleStartYear });
      if (!balance) throw httpError(500, 'Leave balance not found');
      const reverted = Array.isArray(revert.effectiveDateKeys) ? revert.effectiveDateKeys : []; const days = Number(revert.totalDays || 0);
      if (!reverted.length || !days) throw httpError(500, 'Invalid leave revert request');
      const remaining = (leave.effectiveDateKeys || []).filter(value => !reverted.includes(value)).sort();
      for (let i = 1; i < remaining.length; i += 1) {
        const previous = new Date(`${remaining[i - 1]}T00:00:00Z`); previous.setUTCDate(previous.getUTCDate() + 1);
        if (previous.toISOString().slice(0, 10) !== remaining[i]) throw httpError(500, 'Selected revert dates would split the approved leave into multiple parts, which is not supported');
      }
      balance.used = Math.max(0, balance.used - days); balance.remaining += days; await balance.save();
      revert.status = 'approved'; revert.actionBy = actor?._id || null; revert.actionByName = actorName; revert.actionAt = now(); revert.rejectionReason = '';
      if (!remaining.length) { leave.status = 'cancelled'; leave.totalDays = days; }
      else {
        leave.effectiveDateKeys = remaining; leave.totalDays = leave.duration === 'half_day' && remaining.length === 1 ? 0.5 : remaining.length;
        leave.fromDate = startOfDateInZone(remaining[0], timeZone); leave.toDate = endOfDateInZone(remaining.at(-1), timeZone);
        leave.duration = leave.duration === 'half_day' && remaining.length === 1 ? 'half_day' : 'full_day'; leave.halfDaySession = leave.duration === 'half_day' ? leave.halfDaySession : null;
      }
      leave.actionBy = actor?._id || null; leave.actionByName = actorName; leave.actionAt = now(); leave.markModified('revertRequest'); await leave.save(); return leave;
    },
  };
};
