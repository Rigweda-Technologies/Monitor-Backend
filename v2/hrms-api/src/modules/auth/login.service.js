import { httpError } from '../../plugins/errors.js';
const id = value => String(value?._id || value || '');
export const createLoginService = ({ repository, comparePassword, signToken, config, now = () => new Date() }) => {
  const resolve = async ({ email, password }) => {
    const user = await repository.userByEmail(email.toLowerCase().trim());
    if (!user || !await comparePassword(password, user.password)) throw httpError(400, 'Invalid credentials');
    const memberships = await repository.memberships(user._id);
    const membership = memberships[0];
    if (!membership?.organizationId) throw httpError(403, 'No organization access');
    const organizationId = membership.organizationId._id;
    const employee = await repository.employee(user._id, organizationId);
    if (employee?.employmentLifecycleStatus === 'terminated') throw httpError(403, 'Your employment has been terminated. Please contact your manager.');
    if (employee?.employmentLifecycleStatus === 'notice' && employee.noticeEndDate) {
      const end = new Date(employee.noticeEndDate);
      end.setHours(23, 59, 59, 999);
      if (now() > end) throw httpError(403, 'Your notice period is completed. Please contact your manager.');
    }
    const roles = membership.roleIds.filter(role => role && id(role.organizationId) === id(organizationId) && role.status !== 'inactive');
    let activeRole = roles.find(role => id(role) === id(user.lastActiveRoleId)) || roles[0] || null;
    if (!activeRole) {
      const fallback = await repository.roleBySlug(organizationId, 'employee');
      if (fallback && fallback.status !== 'inactive') {
        await repository.addRole(membership._id, fallback._id);
        activeRole = { _id: fallback._id, name: fallback.name, slug: fallback.slug };
        roles.push(activeRole);
      }
    }
    return { user, membership: { _id: membership._id, organizationId: membership.organizationId, roleIds: roles }, activeRole, employee };
  };
  const issue = async ({ user, organizationId, roles, activeRole, switching = false }) => {
    const settings = await repository.settings(organizationId);
    const limit = Number(settings?.maxActiveLoginsPerUser);
    const perOrgLimit = Number.isInteger(limit) && limit > 0 ? limit : config.maxActiveLogins;
    const token = signToken({ userId: user._id, ...(switching ? { _id: user._id, email: user.email } : {}), organizationId, roleIds: roles.map(role => role._id), ...(activeRole ? { activeRoleId: activeRole._id } : {}) });
    await repository.saveSession({ userId: user._id, token, organizationId, activeRoleId: activeRole?._id, perOrgLimit, globalLimit: config.tokenListLimit, now: now() });
    return token;
  };
  const finish = async context => ({
    token: await issue({ user: context.user, organizationId: context.membership.organizationId._id, roles: context.membership.roleIds, activeRole: context.activeRole }),
    userId: context.user._id, organization: context.membership.organizationId, roles: context.membership.roleIds,
    activeRole: context.activeRole, mustChangePassword: Boolean(context.user.passwordChangeRequired),
  });
  return {
    resolve, finish,
    login: async input => finish(await resolve(input)),
    async switchOrganization(identity, { organizationId }) {
      const user = await repository.userById(identity.userId);
      if (!user) throw httpError(401, 'User not found');
      const memberships = await repository.memberships(user._id);
      // Privilege is established from persisted tenant-scoped role membership, never token flags.
      const privileged = memberships.some(m => m.roleIds.some(r => r && id(r.organizationId) === id(m.organizationId) && r.status !== 'inactive' && ['superadmin', 'super_admin'].includes(r.slug)));
      let membership = await repository.membership(user._id, organizationId);
      let roles;
      if (privileged) {
        const organization = await repository.organization(organizationId);
        if (!organization) throw httpError(400, 'OrgAdmin role not found for organization');
        const activeRole = await repository.roleBySlug(organizationId, 'org-admin');
        if (!activeRole || activeRole.status === 'inactive') throw httpError(400, 'OrgAdmin role not found for organization');
        await repository.ensureMembership(user._id, organizationId, activeRole._id);
        roles = [activeRole];
      } else {
        if (!membership) throw httpError(403, 'User does not belong to this organization');
        roles = membership.roleIds.filter(role => role && id(role.organizationId) === id(organizationId) && role.status !== 'inactive');
      }
      const activeRole = roles[0];
      if (!activeRole) throw httpError(400, 'No role available for this organization');
      const token = await issue({ user, organizationId, roles, activeRole, switching: true });
      return { token, organizationId, activeRoleId: activeRole._id, roles };
    },
  };
};
