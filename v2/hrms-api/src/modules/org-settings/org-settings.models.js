import mongoose from 'mongoose';
import { createModels } from '../auth/auth.models.js';

export const getDefaultMaxActiveLoginsPerUser = () => {
  const value = Number(process.env.MAX_ACTIVE_LOGINS_PER_USER_DEFAULT);
  return Number.isInteger(value) && value > 0 ? value : 1;
};

export const createOrgSettingsModels = connection => {
  const models = createModels(connection);
  const schema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: true, unique: true, index: true },
    leaveCreditFrequency: { type: String, enum: ['monthly','quarterly','yearly'], default: 'monthly' },
    leaveTypeCreditMode: { type: String, enum: ['current_month_onwards','full_year'], default: 'current_month_onwards' },
    sandwichRuleEnabled: { type: Boolean, default: false }, attendanceLockEnabled: { type: Boolean, default: true },
    attendanceLockAfterDays: { type: Number, default: 7 }, attendanceLockMode: { type: String, enum: ['days_window','payroll_cutoff'], default: 'payroll_cutoff' },
    attendanceLockDay: { type: Number, default: 25 }, timezone: { type: String, default: 'Asia/Kolkata' }, logoUrl: { type: String, default: '' },
    themeMode: { type: String, enum: ['preset','custom'], default: 'preset' }, themePreset: { type: String, enum: ['ocean','forest','sunset','graphite'], default: 'ocean' },
    themeConfig: { primary: { type: String, default: '' }, secondary: { type: String, default: '' }, background: { type: String, default: '' }, foreground: { type: String, default: '' }, sidebar: { type: String, default: '' }, sidebarGradientStart: { type: String, default: '' }, sidebarGradientEnd: { type: String, default: '' }, sidebarForeground: { type: String, default: '' }, accent: { type: String, default: '' }, card: { type: String, default: '' }, muted: { type: String, default: '' }, border: { type: String, default: '' }, ring: { type: String, default: '' } },
    payrollCutoffDay: { type: Number, default: 25 }, payrollSalaryPayDay: { type: Number, default: 30 }, payrollEnabled: { type: Boolean, default: false },
    minWorkHoursPerDay: { type: Number, default: 8 }, minHalfDayHours: { type: Number, default: 4 },
    attendanceHoursSource: { type: String, enum: ['monitor_agent','manual','biometric','access_card'], default: 'manual' }, attendanceIpEnabled: { type: Boolean, default: false }, attendanceAllowedIp: { type: String, default: '' },
    attendanceSelfieRequired: { type: Boolean, default: false }, attendanceMultiPunchEnabled: { type: Boolean, default: false }, attendanceGeoFenceEnabled: { type: Boolean, default: false },
    attendanceGeoLatitude: { type: Number, default: null }, attendanceGeoLongitude: { type: Number, default: null }, attendanceGeoRadiusMeters: { type: Number, default: 200 }, attendanceDevBypassEnabled: { type: Boolean, default: false },
    probationPeriodDays: { type: Number, default: 90, min: 0 }, noticePeriodDays: { type: Number, default: 30, min: 0 }, employeeIdPrefix: { type: String, default: '' },
    maxActiveLoginsPerUser: { type: Number, default: getDefaultMaxActiveLoginsPerUser, min: 1, max: 20 },
  }, { timestamps: true, autoCreate: false, autoIndex: false, bufferCommands: false });
  const OrgSettings = connection.models.orgSettingsV2 || connection.model('orgSettingsV2', schema, 'org_settings');
  return { ...models, OrgSettings };
};
