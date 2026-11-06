import { httpError } from '../../plugins/errors.js';

const dayKey = (value, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const part = key => parts.find(item => item.type === key)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};
const plusDay = key => { const date = new Date(`${key}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0, 10); };
const weekday = (key, timeZone) => new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(new Date(`${key}T12:00:00Z`));
const dateKeys = (from, to, timeZone) => { const result = []; for (let cursor = from; cursor <= to && result.length < 370; cursor = plusDay(cursor)) result.push(cursor); return result; };
const minusDays = (key, days) => { const date = new Date(`${key}T00:00:00Z`); date.setUTCDate(date.getUTCDate() - days); return date.toISOString().slice(0, 10); };
const normalize = value => /^d{4}-d{2}-d{2}$/.test(String(value || '')) ? String(value) : null;

export const createLeavePolicy = (models, { weekOffService, now = () => new Date() } = {}) => {
  const Settings = models.OrgSettings || models.Settings;
  const timezone = async organizationId => {
    const settings = await Settings.findOne({ organizationId }).select('timezone');
    const organization = await models.Organization.findById(organizationId).select('timezone');
    for (const candidate of [settings?.timezone, organization?.timezone]) {
      try { if (candidate) { new Intl.DateTimeFormat('en-US', { timeZone: candidate }); return candidate; } } catch {}
    }
    return 'Asia/Kolkata';
  };
  const windowMeta = async (organizationId, zone) => {
    const settings = await Settings.findOne({ organizationId }).select('attendanceLockEnabled attendanceLockAfterDays attendanceLockMode attendanceLockDay payrollCutoffDay');
    const attendanceLockMode = settings?.attendanceLockMode || 'days_window';
    const metadata = { attendanceLockEnabled: Boolean(settings?.attendanceLockEnabled), attendanceLockMode, payrollCutoffDay: Number(settings?.payrollCutoffDay ?? 25), attendanceLockDay: Number(settings?.attendanceLockDay ?? settings?.payrollCutoffDay ?? 25), attendanceLockAfterDays: Number(settings?.attendanceLockAfterDays ?? 7), earliestAllowedDateKey: null };
    if (!metadata.attendanceLockEnabled) return metadata;
    const todayKey = dayKey(now(), zone);
    if (attendanceLockMode === 'days_window') metadata.earliestAllowedDateKey = minusDays(todayKey, metadata.attendanceLockAfterDays);
    else {
      const [year, month, day] = todayKey.split('-').map(Number); const cutoff = metadata.attendanceLockDay;
      let y = year; let m = month;
      if (day <= cutoff) { m -= 1; if (m === 0) { m = 12; y -= 1; } }
      metadata.earliestAllowedDateKey = plusDay(`${y}-${String(m).padStart(2, '0')}-01`);
      const cutoffDate = new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00Z`); cutoffDate.setUTCDate(cutoff); metadata.earliestAllowedDateKey = plusDay(cutoffDate.toISOString().slice(0, 10));
    }
    return metadata;
  };
  const weekOffDaysFor = async (organizationId, employee) => weekOffService?.resolveWeekOffDays({ organizationId, shiftId: employee.shiftId }) || [];
  const holidayKeys = async (organizationId, startKey, endKey, zone) => {
    const holidays = await models.Holiday.find({ organizationId, status: 'active' });
    return new Set(holidays.map(item => dayKey(item.date, zone)).filter(key => key >= startKey && key <= endKey));
  };
  const effectiveDays = (fromKey, toKey, offDays, holidaySet, sandwich) => {
    const days = dateKeys(fromKey, toKey, 'UTC').map(key => ({ key, excluded: offDays.includes(weekday(key, 'UTC')) || holidaySet.has(key) }));
    const result = days.filter(day => !day.excluded).map(day => day.key);
    if (sandwich) {
      for (let i = 0; i < days.length;) {
        if (!days[i].excluded) { i += 1; continue; }
        const start = i; while (i < days.length && days[i].excluded) i += 1;
        if (start > 0 && i < days.length && !days[start - 1].excluded && !days[i].excluded) for (let j = start; j < i; j += 1) result.push(days[j].key);
      }
    }
    return [...new Set(result)].sort();
  };
  const enrichLeaves = async ({ leaves, organizationId, timeZone = 'Asia/Kolkata' }) => {
    if (!Array.isArray(leaves) || !leaves.length) return [];
    const employeeIds = [...new Set(leaves.map(item => String(item.employeeId?._id || item.employeeId || '')).filter(Boolean))];
    const [settings, employees, holidays] = await Promise.all([
      Settings.findOne({ organizationId }).select('sandwichRuleEnabled'),
      models.Employee.find({ organizationId, _id: { $in: employeeIds } }).select('_id shiftId'),
      models.Holiday.find({ organizationId, status: 'active' }).select('_id date'),
    ]);
    const weekMap = await weekOffService?.resolveWeekOffMapForEmployees({ organizationId, employees }) || { employeeMap: new Map() };
    const holidaySet = new Set(holidays.map(item => dayKey(item.date, timeZone)));
    const sandwichRuleEnabled = Boolean(settings?.sandwichRuleEnabled);
    return leaves.map(item => {
      const row = item?.toObject ? item.toObject() : { ...item };
      const employeeId = String(row.employeeId?._id || row.employeeId || '');
      const weekOffDays = weekMap.employeeMap.get(employeeId) || [];
      const fromKey = dayKey(row.fromDate, timeZone); const toKey = dayKey(row.toDate, timeZone);
      const days = dateKeys(fromKey, toKey, timeZone).map(key => ({ key, isWeekOff: weekOffDays.includes(weekday(key, timeZone)), isHoliday: holidaySet.has(key) }));
      const effective = Array.isArray(row.effectiveDateKeys) ? row.effectiveDateKeys.filter(key => days.some(day => day.key === key)) : [];
      const effectiveDateKeys = effective.length ? [...new Set(effective)].sort() : effectiveDays(fromKey, toKey, weekOffDays, holidaySet, sandwichRuleEnabled);
      const deducted = effectiveDateKeys.filter(key => { const day = days.find(item => item.key === key); return day?.isWeekOff || day?.isHoliday; });
      const holidayDeducted = deducted.filter(key => days.find(day => day.key === key)?.isHoliday); const weekOffDeducted = deducted.filter(key => days.find(day => day.key === key)?.isWeekOff);
      let description;
      if (!deducted.length) description = sandwichRuleEnabled ? 'Sandwich rule is enabled, but this leave did not deduct any holidays or week offs.' : 'Sandwich rule is disabled, so holidays and week offs were not deducted for this leave.';
      else {
        const parts = []; if (holidayDeducted.length) parts.push(`${holidayDeducted.length} holiday${holidayDeducted.length === 1 ? '' : 's'}`); if (weekOffDeducted.length) parts.push(`${weekOffDeducted.length} week off${weekOffDeducted.length === 1 ? '' : 's'}`);
        description = sandwichRuleEnabled ? `Sandwich rule deducted ${deducted.length} non-working day${deducted.length === 1 ? '' : 's'}: ${parts.join(' and ')}.` : `This leave includes ${deducted.length} deducted non-working day${deducted.length === 1 ? '' : 's'} (${parts.join(' and ')}) even though sandwich rule is currently disabled.`;
      }
      return { ...row, effectiveDateKeys, sandwichRuleEnabled, sandwichSummary: { applied: deducted.length > 0, deductedDays: deducted.length, deductedDateKeys: deducted, holidayDateKeys: holidayDeducted, weekOffDateKeys: weekOffDeducted, description } };
    });
  };
  const policy = {
    timezone,
    async resolvePolicy({ operation, req, employee }) {
      const organizationId = req.user.organizationId; const zone = await timezone(organizationId);
      if (operation === 'timezone') return zone;
      if (operation === 'apply-context') return this.applyContext({ req, employee, timeZone: zone });
      const startKey = normalize(req.body.fromDate) || dayKey(req.body.fromDate, zone); const endKey = normalize(req.body.toDate) || dayKey(req.body.toDate, zone);
      const window = await windowMeta(organizationId, zone);
      if (window.attendanceLockEnabled && window.earliestAllowedDateKey && (startKey < window.earliestAllowedDateKey || endKey < window.earliestAllowedDateKey)) {
        if (window.attendanceLockMode === 'payroll_cutoff') throw httpError(500, `Leave cannot be applied before ${window.earliestAllowedDateKey}. Dates up to attendance lock day ${window.attendanceLockDay} are locked.`);
        throw httpError(500, `Attendance is locked for dates older than ${window.attendanceLockAfterDays} days. Leave cannot be applied for locked dates.`);
      }
      const [offDays, holidaySet, settings] = await Promise.all([weekOffDaysFor(organizationId, employee), holidayKeys(organizationId, startKey, endKey, zone), Settings.findOne({ organizationId }).select('sandwichRuleEnabled')]);
      const sandwich = Boolean(settings?.sandwichRuleEnabled); const effectiveDateKeys = effectiveDays(startKey, endKey, offDays, holidaySet, sandwich);
      if (!effectiveDateKeys.length) {
        if (startKey === endKey && holidaySet.has(startKey)) throw httpError(500, 'Selected date is a holiday');
        if (startKey === endKey && offDays.includes(weekday(startKey, zone))) throw httpError(500, 'Selected date is a week off');
        throw httpError(500, 'Leave cannot be applied only on holidays or week offs without any working day');
      }
      return { effectiveDateKeys };
    },
    async applyContext({ req, employee, timeZone }) {
      const organizationId = req.user.organizationId; const lifecycle = employee.employmentLifecycleStatus || 'confirmed';
      const [holidays, types, balances, leaves, settings, weekOffConfigs, offDays, leaveApplyWindow] = await Promise.all([
        models.Holiday.find({ organizationId, status: 'active', date: { $gte: new Date(new Date().getFullYear(), 0, 1), $lte: new Date(new Date().getFullYear() + 1, 11, 31, 23, 59, 59, 999) } }).sort({ date: 1 }), models.LeaveType.find({ organizationId, status: 'active' }).select('_id name code'),
        models.LeaveBalance.find({ organizationId, employeeId: employee._id }).populate('leaveTypeId', 'name code').sort({ cycleStartYear: -1 }),
        models.Leave.find({ organizationId, employeeId: employee._id, status: { $in: ['pending', 'approved'] } }).populate('leaveTypeId', 'name code').sort({ createdAt: -1 }),
        Settings.findOne({ organizationId }).select('sandwichRuleEnabled'), models.WeekOff.find({ organizationId }).populate('shiftId', 'name code status').select('weekOffDays shiftId'),
        weekOffDaysFor(organizationId, employee), windowMeta(organizationId, timeZone),
      ]);
      const blocked = lifecycle !== 'confirmed'; const defaultWeekOffDays = weekOffConfigs.find(config => !config.shiftId)?.weekOffDays || [];
      const shiftWeekOffDays = weekOffConfigs.find(config => config.shiftId && String(config.shiftId._id || config.shiftId) === String(employee.shiftId))?.weekOffDays || defaultWeekOffDays;
      const restrictionReason = lifecycle === 'probation' ? 'Leave types are unavailable because you are currently on probation. You can apply for leave once your employment status changes to confirmed.' : 'Leave types are unavailable because only confirmed employees can apply for leave.';
      const enrichedLeaves = await enrichLeaves({ leaves, organizationId, timeZone });
      return {
        employeeLifecycleStatus: lifecycle, leaveRestriction: { blocked, reason: blocked ? restrictionReason : '' }, weekOffDays: shiftWeekOffDays,
        weekOffConfig: { defaultWeekOffDays, employeeShiftId: employee.shiftId || null, employeeWeekOffDays: shiftWeekOffDays, shiftConfigs: weekOffConfigs.filter(config => config.shiftId).map(config => ({ shiftId: config.shiftId?._id || config.shiftId, shiftName: config.shiftId?.name || '', shiftCode: config.shiftId?.code || '', weekOffDays: config.weekOffDays || [] })) },
        sandwichRuleEnabled: Boolean(settings?.sandwichRuleEnabled), leaveApplyWindow, holidays: holidays.map(item => ({ _id: item._id, name: item.name, date: item.date })), leaveTypes: blocked ? [] : types,
        balances: (blocked ? [] : balances).map(balance => ({ leaveTypeId: balance.leaveTypeId?._id || balance.leaveTypeId, leaveType: balance.leaveTypeId?.name || '', code: balance.leaveTypeId?.code || '', cycleStartYear: balance.cycleStartYear, total: balance.total, used: balance.used, pending: balance.pending || 0, remaining: balance.remaining })),
        myLeaves: blocked ? [] : enrichedLeaves.map(item => ({ _id: item._id, leaveTypeId: item.leaveTypeId?._id || item.leaveTypeId, leaveType: item.leaveTypeId?.name || '', fromDate: item.fromDate, toDate: item.toDate, effectiveDateKeys: item.effectiveDateKeys || [], duration: item.duration || 'full_day', halfDaySession: item.halfDaySession || null, status: item.status, totalDays: item.totalDays, sandwichRuleEnabled: item.sandwichRuleEnabled, sandwichSummary: item.sandwichSummary || null })),
      };
    },
  };
  policy.resolvePolicy = policy.resolvePolicy.bind(policy);
  policy.applyContext = policy.applyContext.bind(policy);
  policy.enrichLeaves = (leaves, organizationId, timeZone) => enrichLeaves({ leaves, organizationId, timeZone });
  return policy;
};
