import { httpError } from '../../plugins/errors.js';
import { getDefaultMaxActiveLoginsPerUser } from './org-settings.models.js';

const DEFAULTS = {
  leaveCreditFrequency: 'monthly', leaveTypeCreditMode: 'current_month_onwards', sandwichRuleEnabled: false,
  attendanceLockEnabled: true, attendanceLockAfterDays: 7, attendanceLockMode: 'payroll_cutoff', attendanceLockDay: 25,
  timezone: 'Asia/Kolkata', logoUrl: '', payrollCutoffDay: 25, payrollSalaryPayDay: 30, payrollEnabled: false,
  minWorkHoursPerDay: 8, minHalfDayHours: 4, attendanceHoursSource: 'manual', attendanceIpEnabled: false,
  attendanceAllowedIp: '', attendanceSelfieRequired: false, attendanceMultiPunchEnabled: false, attendanceGeoFenceEnabled: false,
  attendanceGeoLatitude: null, attendanceGeoLongitude: null, attendanceGeoRadiusMeters: 200, attendanceDevBypassEnabled: false,
  probationPeriodDays: 90, noticePeriodDays: 30, employeeIdPrefix: '', maxActiveLoginsPerUser: getDefaultMaxActiveLoginsPerUser(),
  themeMode: 'preset', themePreset: 'ocean', themeConfig: {},
};
const validTimezone = timezone => {
  if (typeof timezone !== 'string' || !timezone) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }); return true; } catch { return false; }
};
const plain = value => value?.toObject ? value.toObject() : { ...(value || {}) };

export const createOrgSettingsService = (models, { uploadDataUri, ensurePayrollTenantAndDefaults } = {}) => {
  const appendOrganizationBranding = async (organizationId, settings) => {
    const result = plain(settings);
    if (!/^[a-f\d]{24}$/i.test(String(organizationId || ''))) return result;
    const organization = await models.Organization.findById(organizationId).select('name').lean();
    return organization?.name ? { ...result, organizationName: organization.name } : result;
  };
  const requireOrganization = request => {
    if (!request.user?.organizationId) throw httpError(403, 'Organization is required');
    return request.user.organizationId;
  };
  return {
    async get(request) {
      const organizationId = requireOrganization(request);
      const org = await models.Organization.findById(organizationId).select('timezone');
      const timezone = validTimezone(org?.timezone) ? org.timezone : DEFAULTS.timezone;
      let settings = await models.OrgSettings.findOneAndUpdate({ organizationId }, { $setOnInsert: { organizationId, ...DEFAULTS, timezone } }, { new: true, upsert: true });
      if (!settings) settings = await models.OrgSettings.findOne({ organizationId });
      if (!validTimezone(settings.timezone)) { settings.timezone = timezone; await settings.save(); }
      if (settings.maxActiveLoginsPerUser == null) { settings.maxActiveLoginsPerUser = DEFAULTS.maxActiveLoginsPerUser; await settings.save(); }
      if (settings.attendanceLockDay == null) { settings.attendanceLockDay = Number(settings.payrollCutoffDay ?? 25); await settings.save(); }
      return appendOrganizationBranding(organizationId, settings);
    },
    async upsert(request) {
      const organizationId = requireOrganization(request);
      const body = request.body;
      if (!validTimezone(body.timezone)) throw httpError(400, 'Invalid timezone');
      const existing = await models.OrgSettings.findOne({ organizationId }).select('logoUrl themeMode themePreset themeConfig');
      let logoUrl = existing?.logoUrl || '';
      if (body.logoUpload?.base64Data && body.logoUpload?.mimeType) {
        if (!uploadDataUri) throw httpError(503, 'Logo upload is unavailable');
        const uploaded = await uploadDataUri(`data:${body.logoUpload.mimeType};base64,${body.logoUpload.base64Data}`, { folder: 'org-logos', resource_type: 'image' });
        logoUrl = uploaded?.secure_url || '';
      }
      if (body.attendanceIpEnabled && !(body.attendanceAllowedIp || '').trim()) throw httpError(400, 'Allowed office IP is required when IP restriction is enabled');
      if (body.attendanceGeoFenceEnabled && (body.attendanceGeoLatitude == null || body.attendanceGeoLongitude == null)) throw httpError(400, 'Office latitude and longitude are required when geofencing is enabled');
      const update = {
        leaveCreditFrequency: body.leaveCreditFrequency, leaveTypeCreditMode: body.leaveTypeCreditMode, sandwichRuleEnabled: body.sandwichRuleEnabled,
        attendanceLockEnabled: body.attendanceLockEnabled, attendanceLockAfterDays: body.attendanceLockAfterDays, attendanceLockMode: body.attendanceLockMode,
        attendanceLockDay: body.attendanceLockDay, timezone: body.timezone, logoUrl, payrollCutoffDay: body.payrollCutoffDay,
        payrollSalaryPayDay: body.payrollSalaryPayDay, payrollEnabled: body.payrollEnabled, minWorkHoursPerDay: body.minWorkHoursPerDay,
        minHalfDayHours: body.minHalfDayHours, attendanceHoursSource: ['monitor_agent','manual','biometric','access_card'].includes(body.attendanceHoursSource) ? body.attendanceHoursSource : 'manual',
        attendanceIpEnabled: body.attendanceIpEnabled, attendanceAllowedIp: (body.attendanceAllowedIp || '').trim(), attendanceSelfieRequired: body.attendanceSelfieRequired,
        attendanceMultiPunchEnabled: body.attendanceMultiPunchEnabled, attendanceGeoFenceEnabled: body.attendanceGeoFenceEnabled,
        attendanceGeoLatitude: body.attendanceGeoLatitude, attendanceGeoLongitude: body.attendanceGeoLongitude, attendanceGeoRadiusMeters: body.attendanceGeoRadiusMeters,
        attendanceDevBypassEnabled: body.attendanceDevBypassEnabled, probationPeriodDays: body.probationPeriodDays, noticePeriodDays: body.noticePeriodDays,
        employeeIdPrefix: (body.employeeIdPrefix || '').trim().toUpperCase(), maxActiveLoginsPerUser: body.maxActiveLoginsPerUser,
      };
      if (['themeMode','themePreset','themeConfig'].some(field => Object.hasOwn(body, field))) {
        update.themeMode = ['preset','custom'].includes(body.themeMode) ? body.themeMode : existing?.themeMode || DEFAULTS.themeMode;
        update.themePreset = ['ocean','forest','sunset','graphite'].includes(body.themePreset) ? body.themePreset : existing?.themePreset || DEFAULTS.themePreset;
        update.themeConfig = body.themeConfig && typeof body.themeConfig === 'object' ? body.themeConfig : existing?.themeConfig || {};
      }
      const settings = await models.OrgSettings.findOneAndUpdate({ organizationId }, update, { upsert: true, new: true });
      await models.Organization.findByIdAndUpdate(organizationId, { timezone: body.timezone });
      if (settings.payrollEnabled) {
        if (!ensurePayrollTenantAndDefaults) throw httpError(503, 'Payroll provisioning is unavailable');
        await ensurePayrollTenantAndDefaults({ organizationId, actorId: request.user.userId, orgSettings: plain(settings) });
      }
      return appendOrganizationBranding(organizationId, settings);
    },
    async getTheme(request) {
      const organizationId = requireOrganization(request);
      const settings = await models.OrgSettings.findOne({ organizationId }).select('logoUrl themeMode themePreset themeConfig -_id').lean();
      return appendOrganizationBranding(organizationId, settings || { logoUrl: '', themeMode: DEFAULTS.themeMode, themePreset: DEFAULTS.themePreset, themeConfig: {} });
    },
    async updateTheme(request) {
      const organizationId = requireOrganization(request);
      const { themeMode, themePreset, themeConfig } = request.body;
      const settings = await models.OrgSettings.findOneAndUpdate({ organizationId }, { $set: { themeMode, themePreset, themeConfig } }, { upsert: true, new: true, runValidators: true }).select('logoUrl themeMode themePreset themeConfig -_id').lean();
      return appendOrganizationBranding(organizationId, settings);
    },
  };
};
