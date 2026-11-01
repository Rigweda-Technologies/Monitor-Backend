import { httpError } from '../../plugins/errors.js';

const normalizeRole = value => String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-').replace(/-+/g, '-');
const adminRoles = new Set(['admin', 'org-admin', 'superadmin']);
const toPlain = step => step?.toObject ? step.toObject() : { ...(step || {}) };
const ordered = steps => [...(steps || [])].map(toPlain).sort((a, b) => Number(a.stepNumber || 0) - Number(b.stepNumber || 0));

export const createLeaveApproval = models => {
  const buildRuntimeSteps = (flow, employee) => {
    const steps = (flow.steps || []).map(step => {
      let approverEmployeeId = null; let approverRoleSlug = null;
      if (step.approverType === 'manager') {
        if (!employee?.managerId) throw new Error('Manager is not assigned for this employee');
        approverEmployeeId = employee.managerId;
      } else if (step.approverType === 'employee') approverEmployeeId = step.employeeId || null;
      else if (step.approverType === 'role') approverRoleSlug = step.roleSlug || null;
      return { stepNumber: step.stepNumber, approverType: step.approverType, approverEmployeeId, approverRoleSlug, status: 'queued', actionBy: null, actionByName: null, actionAt: null, remarks: null };
    }).sort((a, b) => a.stepNumber - b.stepNumber);
    if (steps.length) steps[0].status = 'pending';
    return steps;
  };
  const context = async req => {
    const [employee, role] = await Promise.all([
      models.Employee.findOne({ userId: req.user.userId, organizationId: req.user.organizationId }).select('_id'),
      req.user.activeRoleId ? models.Role.findOne({ _id: req.user.activeRoleId, organizationId: req.user.organizationId }).select('_id slug name') : null,
    ]);
    return { actorEmployeeId: employee?._id || null, actorRoleId: role?._id || null, actorRoleSlug: role?.slug || '', actorRoleName: role?.name || '' };
  };
  const canApprove = (step, actor, allowAdminOverride = true) => {
    if (!step || !actor) return false;
    if (allowAdminOverride && adminRoles.has(normalizeRole(actor.actorRoleSlug))) return true;
    if (['manager', 'employee'].includes(step.approverType)) return Boolean(step.approverEmployeeId && actor.actorEmployeeId && String(step.approverEmployeeId._id || step.approverEmployeeId) === String(actor.actorEmployeeId));
    if (step.approverType === 'role') return normalizeRole(step.approverRoleSlug) === normalizeRole(actor.actorRoleSlug) || normalizeRole(step.approverRoleSlug) === normalizeRole(actor.actorRoleName);
    return false;
  };
  const resolveFlow = async ({ organizationId, employee, preferredFlowId, totalDays }) => {
    let flow = preferredFlowId ? await models.ApprovalFlow.findOne({ _id: preferredFlowId, organizationId, moduleKey: 'leave', isActive: true }) : null;
    if (preferredFlowId && !flow) throw new Error('Assigned approval flow is missing, inactive, or invalid for this module');
    if (!flow) {
      const flows = await models.ApprovalFlow.find({ organizationId, moduleKey: 'leave', isActive: true });
      const size = item => item.minDays == null || item.maxDays == null ? Number.POSITIVE_INFINITY : Number(item.maxDays) - Number(item.minDays);
      flow = flows.sort((a, b) => size(a) - size(b) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).find(item => (item.minDays == null || totalDays >= item.minDays) && (item.maxDays == null || totalDays <= item.maxDays));
    }
    return flow ? { flowId: flow._id, steps: buildRuntimeSteps(flow, employee) } : { flowId: null, steps: [] };
  };
  const resolveCurrent = steps => {
    const next = ordered(steps); let step = next.find(item => item.status === 'pending');
    if (!step) { step = next.find(item => !['approved', 'rejected'].includes(item.status)); if (step) step.status = 'pending'; }
    return { steps: next, currentStep: step || null, currentApprovalStep: step?.stepNumber || null };
  };
  const repair = async leave => {
    if (!leave || leave.status !== 'pending' || !leave.approvalFlowId || !leave.approvalSteps?.length) return leave;
    const flow = await models.ApprovalFlow.findOne({ _id: leave.approvalFlowId, organizationId: leave.organizationId });
    const employee = await models.Employee.findOne({ _id: leave.employeeId, organizationId: leave.organizationId }).select('_id managerId');
    if (!flow || !employee) return leave;
    const rebuilt = buildRuntimeSteps(flow, employee);
    const existing = new Map(ordered(leave.approvalSteps).map(step => [Number(step.stepNumber), step]));
    const steps = rebuilt.map(step => {
      const previous = existing.get(Number(step.stepNumber));
      return previous && ['approved', 'rejected'].includes(previous.status) ? { ...step, status: previous.status, actionBy: previous.actionBy || null, actionAt: previous.actionAt || null, remarks: previous.remarks || null } : step;
    });
    const resolved = resolveCurrent(steps);
    const before = JSON.stringify({ steps: ordered(leave.approvalSteps), current: leave.currentApprovalStep });
    const after = JSON.stringify({ steps: resolved.steps, current: resolved.currentApprovalStep });
    leave.approvalSteps = resolved.steps; leave.currentApprovalStep = resolved.currentApprovalStep;
    if (before !== after) { leave.markModified?.('approvalSteps'); await leave.save?.(); }
    return leave;
  };
  const advance = ({ steps, action, actionBy, actionByName, remarks }) => {
    const next = ordered(steps); const index = next.findIndex(item => item.status === 'pending');
    if (index < 0) throw new Error('No pending approval step found');
    const current = next[index]; current.actionBy = actionBy || null; current.actionByName = actionByName || null; current.actionAt = new Date(); current.remarks = remarks || null;
    if (action === 'rejected') { current.status = 'rejected'; return { steps: next, finalStatus: 'rejected', currentApprovalStep: null, isIntermediateApproval: false }; }
    current.status = 'approved'; const queued = next.find(item => item.status === 'queued');
    if (!queued) return { steps: next, finalStatus: 'approved', currentApprovalStep: null, isIntermediateApproval: false };
    queued.status = 'pending'; return { steps: next, finalStatus: 'pending', currentApprovalStep: queued.stepNumber, isIntermediateApproval: true };
  };
  return {
    resolveFlow,
    async repair(leave) { return repair(leave); },
    async filterPending(req, leaves) {
      const actor = await context(req);
      const filtered = [];
      for (const leave of leaves) {
        await repair(leave);
        if (!leave.approvalSteps?.length) { filtered.push(leave); continue; }
        const current = resolveCurrent(leave.approvalSteps).currentStep;
        if (canApprove(current, actor, true)) filtered.push(leave);
      }
      return filtered;
    },
    async listPending(req) {
      const actor = await context(req); const role = normalizeRole(actor.actorRoleSlug);
      if (!['manager', 'hr', ...adminRoles].includes(role)) return [];
      const query = { organizationId: req.user.organizationId, status: 'pending' };
      if (role === 'manager') {
        if (!actor.actorEmployeeId) return [];
        const reportIds = await models.Employee.find({ organizationId: req.user.organizationId, managerId: actor.actorEmployeeId }).distinct('_id');
        query.employeeId = { $in: reportIds };
      }
      const rows = await models.Leave.find(query).populate('employeeId', 'firstName lastName employeeCode').populate('leaveTypeId', 'name code').sort({ createdAt: -1 });
      const result = [];
      for (const leave of rows) {
        await repair(leave);
        if (!leave.approvalSteps?.length || canApprove(resolveCurrent(leave.approvalSteps).currentStep, actor, true)) result.push(leave);
      }
      return result;
    },
    async scopeList(req) {
      const query = { organizationId: req.user.organizationId };
      const requestedEmployeeId = req.query.employeeId ? String(req.query.employeeId) : '';
      const actor = await context(req); const role = normalizeRole(actor.actorRoleSlug);
      if (role === 'manager') {
        if (actor.actorEmployeeId) {
          const reports = await models.Employee.find({ organizationId: req.user.organizationId, managerId: actor.actorEmployeeId }).distinct('_id');
          if (requestedEmployeeId && !reports.some(id => String(id) === requestedEmployeeId)) throw new Error('Access denied');
          query.employeeId = requestedEmployeeId || { $in: reports };
        } else query.employeeId = { $in: [] };
      } else if (!['hr', ...adminRoles].includes(role)) {
        if (!actor.actorEmployeeId) query.employeeId = { $in: [] };
        else if (requestedEmployeeId && String(actor.actorEmployeeId) !== requestedEmployeeId) throw new Error('Access denied');
        else query.employeeId = requestedEmployeeId || actor.actorEmployeeId;
      } else if (requestedEmployeeId) query.employeeId = requestedEmployeeId;
      return query;
    },
    async authorizeAction({ req, leave, revert = false }) {
      await repair(leave);
      const actor = await context(req); const role = normalizeRole(actor.actorRoleSlug);
      if (revert && !adminRoles.has(role)) throw new Error('Only organization admin can action leave revert requests');
      if (!['manager', 'hr', ...adminRoles].includes(role)) throw new Error('Only reporting manager, HR, or admin can action requests');
      if (role === 'manager') {
        const manager = actor.actorEmployeeId;
        const report = manager && await models.Employee.exists({ organizationId: req.user.organizationId, _id: leave.employeeId, managerId: manager });
        if (!report) throw new Error('Access denied');
      }
      if (leave.approvalSteps?.length) {
        const current = resolveCurrent(leave.approvalSteps).currentStep;
        if (!current || !canApprove(current, actor, true)) throw httpError(500, `You are not the current approver for this step. Pending step: S${current?.stepNumber || '?'} ${current?.approverType || 'Unknown'}`);
      }
      if (req.body.status && !['approved', 'rejected', 'cancelled'].includes(req.body.status)) throw new Error('Invalid leave action');
      return actor;
    },
    async progress({ req, leave, actor }) {
      const actorContext = await context(req); const current = resolveCurrent(leave.approvalSteps).currentStep;
      const override = adminRoles.has(normalizeRole(actorContext.actorRoleSlug)) && current && !canApprove(current, actorContext, false);
      let progress;
      if (override) {
        const steps = ordered(leave.approvalSteps); const firstOpen = steps.findIndex(step => !['approved', 'rejected'].includes(step.status)); const timestamp = new Date();
        progress = { steps: steps.map((step, index) => {
          if (['approved', 'rejected'].includes(step.status)) return step;
          if (req.body.status === 'approved') return { ...step, status: 'approved', actionBy: actor?._id || null, actionByName: `${actor?.firstName || ''} ${actor?.lastName || ''}`.trim() || 'Organization Admin', actionAt: timestamp, remarks: index === firstOpen ? 'Approved by organization admin' : 'Auto-approved by organization admin' };
          if (index === firstOpen) return { ...step, status: 'rejected', actionBy: actor?._id || null, actionByName: `${actor?.firstName || ''} ${actor?.lastName || ''}`.trim() || 'Organization Admin', actionAt: timestamp, remarks: req.body.rejectionReason || 'Rejected by organization admin' };
          return step;
        }), finalStatus: req.body.status, currentApprovalStep: null, isIntermediateApproval: false };
      } else progress = advance({ steps: resolveCurrent(leave.approvalSteps).steps, action: req.body.status, actionBy: actor?._id || null, actionByName: `${actor?.firstName || ''} ${actor?.lastName || ''}`.trim() || req.user.email || 'Organization Admin', remarks: req.body.status === 'rejected' ? req.body.rejectionReason || '' : null });
      return progress;
    },
  };
};
