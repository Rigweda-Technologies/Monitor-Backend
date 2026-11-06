import { permissionCatalog } from './permission-catalog.js';

const defaultRoles = [
  { name:'OrgAdmin', slug:'org-admin' },
  { name:'HR', slug:'hr' },
  { name:'Manager', slug:'manager' },
  { name:'Employee', slug:'employee' },
];
const payrollExclusions = [
  'PAYROLL_CONFIG_MANAGE','PAYROLL_RUN_CREATE','PAYROLL_RUN_VIEW','PAYROLL_RUN_SUBMIT','PAYROLL_RUN_APPROVE',
  'PAYROLL_RUN_LOCK','PAYROLL_RUN_REOPEN','PAYROLL_PAYSLIP_VIEW','PAYROLL_REPORT_VIEW',
];
const managerPermissions = [
  'EMP_VIEW','LEAVE_VIEW_ALL','LEAVE_VIEW_SELF','LEAVE_ACTION','LEAVE_APPLY','EMP_SELF_VIEW','EMP_SELF_EDIT','DEPT_VIEW','DESIG_VIEW',
  'TIMESHEET_CHECKIN_SELF','TIMESHEET_CHECKOUT_SELF','ATTENDANCE_VIEW_ALL','TIMESHEET_VIEW_SELF','TIMESHEET_CREATE_SELF',
  'TIMESHEET_EDIT_SELF','TIMESHEET_SUBMIT_SELF','TIMESHEET_RECALL_SELF','TIMESHEET_VIEW_ALL','TIMESHEET_VIEW_ONLINE',
  'TIMESHEET_ACTION','NOTIFICATION_VIEW_SELF','NOTIFICATION_MANAGE_SELF','EXPENSE_VIEW','EXPENSE_ACTION',
];
const blockedEmployeePermissions = new Set([
  'PERMISSION_VIEW','ORG_SETTINGS_VIEW','ORG_SETTINGS_MANAGE','WEEK_OFF_VIEW','WEEK_OFF_MANAGE','LEAVE_TYPE_VIEW','LEAVE_TYPE_MANAGE',
  'SHIFT_VIEW','SHIFT_VIEW_SELF','SHIFT_MANAGE','APPROVAL_FLOW_VIEW','APPROVAL_FLOW_MANAGE','ROLE_CREATE','ROLE_UPDATE','ROLE_DELETE',
  'ROLE_VIEW','ORG_VIEW','ORG_MANAGE',
]);
const employeeAllowed = code => !blockedEmployeePermissions.has(code) && !code.startsWith('PAYROLL_') && (
  code.includes('_SELF') || ['EMP_ORG_TREE_VIEW','TIMESHEET_VIEW_ONLINE','LEAVE_APPLY','DEPT_VIEW','DESIG_VIEW','TIMESHEET_VIEW_ALL','TIMESHEET_RECALL_SELF'].includes(code)
);
const resolvePermissionIds = (permissions, slug) => {
  if (slug === 'org-admin') return permissions.map(permission => permission._id);
  if (slug === 'admin') return permissions.filter(permission => !payrollExclusions.includes(permission.code)).map(permission => permission._id);
  if (slug === 'hr') return permissions.filter(permission => permission.code !== 'ORG_MANAGE').map(permission => permission._id);
  if (slug === 'manager') return permissions.filter(permission => managerPermissions.includes(permission.code)).map(permission => permission._id);
  if (slug === 'employee') return permissions.filter(permission => employeeAllowed(permission.code)).map(permission => permission._id);
  return [];
};

export const createOrganizationSeeder = ({ Role, Permission }) => async organizationId => {
  let allAccess = await Permission.findOne({ organizationId, code:'*' });
  if (!allAccess) await Permission.create({ organizationId, name:'ALL_ACCESS', code:'*', module:'ORG' });
  for (const permission of permissionCatalog) {
    if (!await Permission.findOne({ organizationId, code:permission.code })) {
      await Permission.create({ organizationId, name:permission.name, code:permission.code, module:permission.module });
    }
  }
  for (const role of defaultRoles) {
    if (!await Role.findOne({ organizationId, slug:role.slug })) {
      await Role.create({ organizationId, name:role.name, slug:role.slug, permissionIds:[], isSystemRole:false });
    }
  }
  const [roles, permissions] = await Promise.all([Role.find({ organizationId }), Permission.find({ organizationId })]);
  for (const role of roles) {
    const permissionIds = resolvePermissionIds(permissions, role.slug);
    if (!permissionIds.length && !['admin'].includes(role.slug)) continue;
    role.permissionIds = permissionIds;
    await role.save();
  }
};
