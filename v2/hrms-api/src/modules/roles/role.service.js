import mongoose from 'mongoose';

const protectedSlugs = new Set(['org-admin','hr','manager','employee']);
const id = value => mongoose.isObjectIdOrHexString(value) ? new mongoose.Types.ObjectId(value) : value;
const restoreProtected = async (repository, roles) => {
  const restore = roles.filter(role => protectedSlugs.has(role.slug) && role.status === 'inactive');
  for (const role of restore) {
    const document = await repository.roleInOrganization(role._id, role.organizationId);
    if (document) { document.status = 'active'; await repository.updateRoleDocument(document); }
    role.status = 'active';
  }
  return roles;
};

export const createRoleService = ({ repository, signToken, config, now = () => new Date() }) => ({
  async create({ organizationId, name, slug, permissionIds = [], isSystemRole = false }) {
    if (!await repository.organizationExists(organizationId)) throw Object.assign(new Error('Organization not found'), { code: 404 });
    if (await repository.roleBySlugInOrganization(organizationId, slug)) throw Object.assign(new Error('Role with same slug already exists in this organization'), { code: 409 });
    let resolved = permissionIds;
    if (!resolved.length) resolved = (await repository.roleBySlugInOrganization(organizationId, 'employee'))?.permissionIds || [];
    const permissions = resolved.length ? await repository.permissionIdsInOrganization(organizationId, resolved) : [];
    if (permissions.length !== resolved.length) throw Object.assign(new Error('One or more permissions are invalid or do not belong to this organization'), { code: 400 });
    return repository.createRole({ organizationId, name, slug, permissionIds: resolved, isSystemRole });
  },
  async update(roleId, organizationId, data) {
    const role = await repository.roleInOrganization(id(roleId), id(organizationId));
    if (!role) throw Object.assign(new Error('Role not found'), { code: 404 });
    if (protectedSlugs.has(role.slug) && data?.status && data.status !== role.status) throw Object.assign(new Error('Default roles cannot be deactivated'), { code: 403 });
    if (role.isSystemRole && data?.status && data.status !== role.status) throw Object.assign(new Error('System roles cannot be deactivated'), { code: 403 });
    Object.assign(role, data);
    return repository.updateRoleDocument(role);
  },
  async remove(roleId, organizationId) {
    const role = await repository.roleInOrganization(id(roleId), id(organizationId));
    if (!role) throw Object.assign(new Error('Role not found'), { code: 404 });
    if (protectedSlugs.has(role.slug)) throw Object.assign(new Error('Default roles cannot be deactivated'), { code: 403 });
    if (role.isSystemRole) throw Object.assign(new Error('System roles cannot be deactivated'), { code: 403 });
    if (role.status !== 'inactive') { role.status = 'inactive'; await repository.updateRoleDocument(role); }
  },
  async list(organizationId) { return restoreProtected(repository, await repository.rolesByOrganization(organizationId)); },
  async getById(roleId, organizationId) {
    const role = await repository.roleInOrganization(id(roleId), id(organizationId));
    if (!role) throw Object.assign(new Error('Role not found'), { code: 404 });
    const [restored] = await restoreProtected(repository, [role.toObject()]);
    return restored;
  },
  async switchRole(request) {
    const { user } = request;
    const roleId = request.body.roleId;
    if (String(user.activeRoleId || '') === roleId) {
      const role = await repository.roleInOrganization(id(roleId), id(user.organizationId));
      return { alreadyActive: true, activeRoleId: roleId, activeRole: role ? { _id: role._id, name: role.name, slug: role.slug } : null };
    }
    if (!(user.roleIds || []).map(String).includes(roleId)) throw Object.assign(new Error('Role not assigned to user'), { code: 403 });
    const role = await repository.roleInOrganization(id(roleId), id(user.organizationId));
    if (!role) throw Object.assign(new Error('Role not found'), { code: 404 });
    const token = signToken({ userId: user.userId, email: user.email, organizationId: user.organizationId, roleIds: user.roleIds, activeRoleId: role._id });
    const settings = await repository.settings(user.organizationId);
    const configured = Number(settings?.maxActiveLoginsPerUser);
    const perOrgLimit = Number.isInteger(configured) && configured > 0 ? configured : config.maxActiveLogins;
    await repository.saveSession({ userId: user.userId, token, organizationId: user.organizationId, activeRoleId: role._id, perOrgLimit, globalLimit: config.tokenListLimit, now: now() });
    await repository.updateLastRole(user.userId, role._id);
    return { alreadyActive: false, token, activeRoleId: role._id, activeRole: { _id: role._id, name: role.name, slug: role.slug } };
  },
});
