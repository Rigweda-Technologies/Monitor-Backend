const nameOf = employee => `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim();
const dateLabel = value => new Date(value).toDateString();

export const createLeaveEffects = (models, { notificationService, sendMail = async () => {} } = {}) => {
  const Membership = models.Membership || models.OrgUser;
  const notifySafe = notificationService?.createNotificationSafe || (async () => null);
  const sendSafe = async ({ toEmail, toName, subject, message }) => {
    if (!toEmail) return;
    try { await sendMail('notification', toName || 'User', subject, message, toEmail); } catch {}
  };
  const recipientsFor = async (organizationId, step) => {
    if (!step) return [];
    if (['manager', 'employee'].includes(step.approverType)) {
      const employee = await models.Employee.findOne({ _id: step.approverEmployeeId, organizationId, status: 'active' }).select('_id userId firstName lastName employeeCode');
      return employee?.userId ? [employee] : [];
    }
    if (step.approverType !== 'role' || !step.approverRoleSlug) return [];
    const normalize = value => String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-').replace(/-+/g, '-');
    const roles = await models.Role.find({ organizationId }).select('_id slug name');
    const normalized = normalize(step.approverRoleSlug);
    const role = roles.find(item => normalize(item.slug) === normalized || normalize(item.name) === normalized);
    if (!role) return [];
    const memberships = await Membership.find({ organizationId, roleIds: role._id }).select('userId');
    const userIds = [...new Set(memberships.map(item => String(item.userId)).filter(Boolean))];
    return userIds.length ? models.Employee.find({ organizationId, status: 'active', userId: { $in: userIds } }).select('_id userId firstName lastName employeeCode') : [];
  };
  const notifyStep = async ({ organizationId, step, actorEmployeeId, leave, employee, message }) => {
    for (const recipient of await recipientsFor(organizationId, step)) {
      await notifySafe({ organizationId, recipientUserId: recipient.userId, recipientEmployeeId: recipient._id, actorEmployeeId: actorEmployeeId || null, type: 'leave_pending_approval', title: 'Leave approval pending', message, meta: { leaveId: leave._id, status: leave.status, currentApprovalStep: leave.currentApprovalStep } });
    }
  };
  return {
    async audit({ req, module, action, entityId, before, after }) {
      if (!models.AuditLog) return null;
      return models.AuditLog.create({ organizationId: req.user.organizationId, userId: req.user?._id || req.user?.userId, module, action, entityId, before, after, ipAddress: req.ip, userAgent: req.headers?.['user-agent'] || '' });
    },
    async notify({ event, leave, employee, flow }) {
      const organizationId = leave.organizationId;
      if (event === 'leave-applied') {
        const pendingStep = (flow?.steps || []).find(step => step.status === 'pending');
        if (pendingStep) await notifyStep({ organizationId, step: pendingStep, actorEmployeeId: employee?._id, leave, employee, message: `${nameOf(employee)} applied leave from ${dateLabel(leave.fromDate)} to ${dateLabel(leave.toDate)}.` });
        else if (employee?.managerId) {
          const manager = await models.Employee.findById(employee.managerId).populate('userId', 'email');
          if (manager?.userId?.email) await sendSafe({ toEmail: manager.userId.email, toName: manager.firstName, subject: 'New Leave Request', message: `${nameOf(employee)} applied leave from ${leave.fromDate} to ${leave.toDate}.` });
        }
        return;
      }
      if (event === 'leave-pending-approval') {
        const step = (leave.approvalSteps || []).find(item => item.status === 'pending');
        const subjectEmployee = await models.Employee.findById(leave.employeeId).select('firstName lastName');
        await notifyStep({ organizationId, step, actorEmployeeId: employee?._id, leave, employee: subjectEmployee, message: `${nameOf(subjectEmployee) || 'Employee'} leave is waiting for your approval.` });
        return;
      }
      if (event === 'leave-action') {
        const subjectEmployee = await models.Employee.findById(leave.employeeId).populate('userId', 'email');
        const actorName = nameOf(employee) || 'Manager';
        if (subjectEmployee?.userId?._id) await notifySafe({ organizationId, recipientUserId: subjectEmployee.userId._id, recipientEmployeeId: subjectEmployee._id, actorEmployeeId: employee?._id || null, type: 'leave_action', title: `Leave ${leave.status}`, message: `${actorName} marked your leave (${dateLabel(leave.fromDate)} to ${dateLabel(leave.toDate)}) as ${leave.status}.`, meta: { leaveId: leave._id, status: leave.status } });
        if (subjectEmployee?.userId?.email) await sendSafe({ toEmail: subjectEmployee.userId.email, toName: subjectEmployee.firstName, subject: `Leave ${leave.status}`, message: `Your leave request from ${dateLabel(leave.fromDate)} to ${dateLabel(leave.toDate)} is ${leave.status}.` });
        return;
      }
      if (event === 'leave-revert-request') {
        const admins = await models.User.find({ organizationId, activeRoleSlug: { $in: ['admin', 'org-admin', 'superadmin'] } }).select('_id');
        const from = leave.revertRequest?.effectiveDateKeys?.[0]; const to = leave.revertRequest?.effectiveDateKeys?.at(-1);
        await Promise.all(admins.map(user => notifySafe({ organizationId, recipientUserId: user._id, recipientEmployeeId: null, actorEmployeeId: employee?._id || null, type: 'leave_revert_request', title: 'Leave revert request pending', message: `${nameOf(employee) || 'Employee'} requested leave revert for ${from} to ${to}.`, meta: { leaveId: leave._id, revertRequestStatus: 'pending' } })));
      }
    },
  };
};
