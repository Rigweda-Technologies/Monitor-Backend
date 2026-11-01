import { httpError } from '../../plugins/errors.js';
import {
  isValidTimeZone, toDateKeyInTimeZone, addDaysToDateKey, zonedDateTimeToUtc,
  startOfDayInTimeZone, endOfDayInTimeZone, parseMonthRangeInTimeZone,
  getDayInTimeZone, getWeekdayForDateKey,
} from './timesheet.timezone.js';

const normalizeRoleKey = value => String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-').replace(/-+/g, '-');
const roleMatchesStep = (stepRole, actorSlug, actorName) => {
  const wanted = normalizeRoleKey(stepRole);
  return Boolean(wanted && (wanted === normalizeRoleKey(actorSlug) || wanted === normalizeRoleKey(actorName)));
};
const defaultRange = flow => flow.minDays == null && flow.maxDays == null;
const rangeSize = flow => {
  const min = flow.minDays == null ? Number.NEGATIVE_INFINITY : Number(flow.minDays);
  const max = flow.maxDays == null ? Number.POSITIVE_INFINITY : Number(flow.maxDays);
  return Number.isFinite(min) && Number.isFinite(max) ? max - min : Number.POSITIVE_INFINITY;
};
const compareFlowPriority = (left, right) => {
  if (defaultRange(left) !== defaultRange(right)) return defaultRange(left) ? 1 : -1;
  const size = rangeSize(left) - rangeSize(right);
  if (size !== 0) return size;
  return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
};
const plainStep = step => step?.toObject ? step.toObject() : step?._doc ? { ...step._doc } : { ...(step || {}) };
const cloneSteps = (steps = []) => steps.map(step => {
  const plain = plainStep(step);
  return { ...plain, approverEmployeeId: plain.approverEmployeeId || null, approverRoleSlug: plain.approverRoleSlug || null, actionBy: plain.actionBy || null, actionByName: plain.actionByName || null, actionAt: plain.actionAt || null, remarks: plain.remarks || null };
});
const sortSteps = steps => [...steps].sort((left, right) => Number(left.stepNumber || 0) - Number(right.stepNumber || 0));
const getCurrentPendingStep = (steps = []) => steps.find(step => step.status === 'pending') || null;

const buildLeaveDayMeta = ({ fromDate, toDate, weekOffDays = [], holidaySet = new Set(), timeZone = 'Asia/Kolkata' }) => {
  const result = [];
  let cursor = /^\d{4}-\d{2}-\d{2}$/.test(String(fromDate || '')) ? String(fromDate) : toDateKeyInTimeZone(fromDate, timeZone);
  const end = /^\d{4}-\d{2}-\d{2}$/.test(String(toDate || '')) ? String(toDate) : toDateKeyInTimeZone(toDate, timeZone);
  while (cursor <= end) {
    const isWeekOff = weekOffDays.includes(getWeekdayForDateKey(cursor, timeZone));
    const isHoliday = holidaySet.has(cursor);
    result.push({ key: cursor, isWeekOff, isHoliday, excluded: isWeekOff || isHoliday });
    cursor = addDaysToDateKey(cursor, 1);
  }
  return result;
};
const sandwichKeys = days => {
  const result = []; let index = 0;
  while (index < days.length) {
    if (!days[index]?.excluded) { index += 1; continue; }
    const start = index;
    while (index < days.length && days[index]?.excluded) index += 1;
    const end = index - 1;
    if (days[start - 1] && !days[start - 1].excluded && days[end + 1] && !days[end + 1].excluded) {
      for (let cursor = start; cursor <= end; cursor += 1) result.push(days[cursor].key);
    }
  }
  return result;
};
const analyzeLeaveDateKeys = ({ fromDate, toDate, weekOffDays = [], holidaySet = new Set(), effectiveDateKeys = [], sandwichRuleEnabled, timeZone = 'Asia/Kolkata' }) => {
  const dayMeta = buildLeaveDayMeta({ fromDate, toDate, weekOffDays, holidaySet, timeZone });
  const byKey = new Map(dayMeta.map(day => [day.key, day]));
  const workingDateKeys = dayMeta.filter(day => !day.excluded).map(day => day.key);
  const derived = sandwichRuleEnabled ? [...workingDateKeys, ...sandwichKeys(dayMeta)].sort() : workingDateKeys;
  const persisted = Array.isArray(effectiveDateKeys) ? effectiveDateKeys.filter(key => byKey.has(key)) : [];
  const finalKeys = persisted.length ? [...new Set(persisted)].sort() : derived;
  const sandwichDeductedDateKeys = finalKeys.filter(key => Boolean(byKey.get(key)?.excluded));
  return {
    dayMeta,
    workingDateKeys,
    effectiveDateKeys: finalKeys,
    sandwichDeductedDateKeys,
    sandwichHolidayDateKeys: sandwichDeductedDateKeys.filter(key => byKey.get(key)?.isHoliday),
    sandwichWeekOffDateKeys: sandwichDeductedDateKeys.filter(key => byKey.get(key)?.isWeekOff),
  };
};

export const createTimesheetPolicies = ({ models, weekOffService }) => {
  if (!models?.ApprovalFlow || !models?.Employee || !models?.Role || !models?.OrgUser) throw new TypeError('Timesheet approval policy models (ApprovalFlow, Employee, Role, OrgUser) are required');
  if (!weekOffService?.resolveWeekOffMapForEmployees || !weekOffService?.resolveWeekOffDays) throw new TypeError('V2 week-off service is required');
  const { ApprovalFlow, Employee, Role, OrgUser } = models;
  const buildRuntimeSteps = ({ flow, subjectEmployee }) => {
    const steps = (flow.steps || []).map(step => {
      let approverEmployeeId = null; let approverRoleSlug = null;
      if (step.approverType === 'manager') {
        if (!subjectEmployee?.managerId) throw httpError(500, 'Manager is not assigned for this employee');
        approverEmployeeId = subjectEmployee.managerId;
      } else if (step.approverType === 'employee') approverEmployeeId = step.employeeId || null;
      else if (step.approverType === 'role') approverRoleSlug = step.roleSlug || null;
      return { stepNumber: step.stepNumber, approverType: step.approverType, approverEmployeeId, approverRoleSlug, status: 'queued', actionBy: null, actionByName: null, actionAt: null, remarks: null };
    }).sort((left, right) => Number(left.stepNumber) - Number(right.stepNumber));
    if (steps.length) steps[0].status = 'pending';
    return steps;
  };
  const resolveApplicableFlow = async ({ organizationId, moduleKey, subjectEmployee, preferredFlowId = null, totalDays = null }) => {
    let flow = null;
    if (preferredFlowId) {
      flow = await ApprovalFlow.findOne({ _id: preferredFlowId, organizationId, moduleKey, isActive: true });
      if (!flow) throw httpError(500, 'Assigned approval flow is missing, inactive, or invalid for this module');
    }
    if (!flow) {
      const flows = await ApprovalFlow.find({ organizationId, moduleKey, isActive: true });
      flow = flows.sort(compareFlowPriority).find(item => totalDays == null || ((item.minDays == null || Number(totalDays) >= Number(item.minDays)) && (item.maxDays == null || Number(totalDays) <= Number(item.maxDays))));
    }
    return flow ? { flowId: flow._id, steps: buildRuntimeSteps({ flow, subjectEmployee }) } : null;
  };
  const getActorApprovalContext = async req => {
    const [employee, role] = await Promise.all([
      Employee.findOne({ userId: req.user.userId, organizationId: req.user.organizationId }).select('_id'),
      req.user.activeRoleId ? Role.findOne({ _id: req.user.activeRoleId, organizationId: req.user.organizationId }).select('_id slug name') : null,
    ]);
    return { actorEmployeeId: employee?._id || null, actorRoleId: role?._id || null, actorRoleSlug: role?.slug || null, actorRoleName: role?.name || null };
  };
  const canActorApproveStep = (step, actorContext, options = {}) => {
    if (!step || !actorContext) return false;
    if (options.allowAdminOverride && ['admin', 'org-admin', 'superadmin'].includes(normalizeRoleKey(actorContext.actorRoleSlug))) return true;
    if (step.approverType === 'manager' || step.approverType === 'employee') {
      const expected = step.approverEmployeeId?._id || step.approverEmployeeId;
      return Boolean(expected && actorContext.actorEmployeeId && String(expected) === String(actorContext.actorEmployeeId));
    }
    return step.approverType === 'role' && roleMatchesStep(step.approverRoleSlug, actorContext.actorRoleSlug, actorContext.actorRoleName);
  };
  const findRoleForStep = async (organizationId, roleValue) => {
    const normalized = normalizeRoleKey(roleValue); if (!organizationId || !normalized) return null;
    const roles = await Role.find({ organizationId }).select('_id slug name');
    return roles.find(role => roleMatchesStep(normalized, role.slug, role.name)) || null;
  };
  const resolveRecipientsForStep = async ({ organizationId, step }) => {
    if (!organizationId || !step) return [];
    if (step.approverType === 'employee' || step.approverType === 'manager') {
      if (!step.approverEmployeeId) return [];
      const employee = await Employee.findOne({ _id: step.approverEmployeeId, organizationId, status: 'active' }).select('_id userId firstName lastName employeeCode');
      if (!employee?.userId) return [];
      return [{ employeeId: employee._id, userId: employee.userId, firstName: employee.firstName, lastName: employee.lastName, employeeCode: employee.employeeCode || null }];
    }
    if (step.approverType !== 'role' || !step.approverRoleSlug) return [];
    const role = await findRoleForStep(organizationId, step.approverRoleSlug); if (!role?._id) return [];
    const memberships = await OrgUser.find({ organizationId, roleIds: role._id }).select('userId');
    const userIds = [...new Set(memberships.map(item => item.userId?.toString()).filter(Boolean))]; if (!userIds.length) return [];
    const employees = await Employee.find({ organizationId, status: 'active', userId: { $in: userIds } }).select('_id userId firstName lastName employeeCode');
    return employees.filter(employee => employee.userId).map(employee => ({ employeeId: employee._id, userId: employee.userId, firstName: employee.firstName, lastName: employee.lastName, employeeCode: employee.employeeCode || null }));
  };
  const resolveCurrentPendingStep = ({ steps = [], currentApprovalStep = null }) => {
    const nextSteps = sortSteps(cloneSteps(steps));
    let currentStep = getCurrentPendingStep(nextSteps);
    if (currentStep) return { steps: nextSteps, currentStep, currentApprovalStep: currentStep.stepNumber || currentApprovalStep || null, repaired: false };
    if (currentApprovalStep != null) {
      const indexed = nextSteps.find(step => Number(step.stepNumber || 0) === Number(currentApprovalStep));
      if (indexed && !['approved', 'rejected'].includes(indexed.status)) {
        indexed.status = 'pending'; return { steps: nextSteps, currentStep: indexed, currentApprovalStep: indexed.stepNumber || null, repaired: true };
      }
    }
    const fallback = nextSteps.find(step => !['approved', 'rejected'].includes(step.status));
    if (!fallback) return { steps: nextSteps, currentStep: null, currentApprovalStep: null, repaired: false };
    fallback.status = 'pending'; return { steps: nextSteps, currentStep: fallback, currentApprovalStep: fallback.stepNumber || null, repaired: true };
  };
  const advanceApprovalSteps = ({ steps = [], action, actionBy = null, actionByName = null, remarks = null }) => {
    const normalizedAction = String(action || '').toLowerCase();
    if (!['approved', 'rejected'].includes(normalizedAction)) throw httpError(500, 'Invalid approval action');
    const nextSteps = sortSteps(cloneSteps(steps));
    if (!nextSteps.length) return { steps: [], finalStatus: normalizedAction, isIntermediateApproval: false, currentApprovalStep: null };
    const pendingIndex = nextSteps.findIndex(step => step.status === 'pending');
    if (pendingIndex < 0) throw httpError(500, 'No pending approval step found');
    const pending = nextSteps[pendingIndex]; pending.actionBy = actionBy || null; pending.actionByName = actionByName || null; pending.actionAt = new Date(); pending.remarks = remarks || null;
    if (normalizedAction === 'rejected') { pending.status = 'rejected'; return { steps: nextSteps, finalStatus: 'rejected', isIntermediateApproval: false, currentApprovalStep: null }; }
    pending.status = 'approved';
    const nextQueued = nextSteps.find(step => step.status === 'queued');
    if (!nextQueued) return { steps: nextSteps, finalStatus: 'approved', isIntermediateApproval: false, currentApprovalStep: null };
    nextQueued.status = 'pending'; return { steps: nextSteps, finalStatus: 'pending', isIntermediateApproval: true, currentApprovalStep: nextQueued.stepNumber };
  };
  const normalizeAttendanceRequestDateKey = (value, timeZone) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : toDateKeyInTimeZone(value, timeZone);
  return {
    WeekOffService: weekOffService,
    resolveApplicableFlow, buildRuntimeSteps, getActorApprovalContext, canActorApproveStep, resolveRecipientsForStep,
    advanceApprovalSteps, getCurrentPendingStep, resolveCurrentPendingStep,
    isValidTimeZone, toDateKeyInTimeZone, addDaysToDateKey, zonedDateTimeToUtc,
    startOfDayInTimeZone, endOfDayInTimeZone, parseMonthRangeInTimeZone,
    getDayInTimeZone, getWeekdayForDateKey, analyzeLeaveDateKeys, normalizeAttendanceRequestDateKey,
  };
};
