import { httpError } from '../../plugins/errors.js';
const id = value => String(value?._id || value || '');
export const createSessionService = ({ repository, verifyToken }) => ({
  async authenticate(token) {
    let claims;
    try { claims = verifyToken(token); }
    catch (error) { throw Object.assign(httpError(401, 'Invalid or expired token'), { authError: error.message }); }
    const user = await repository.userById(claims.userId || claims._id);
    if (!user) throw httpError(401, 'User not found');
    if (user.status !== 'active') throw httpError(403, 'User account is not active');
    const active = user.tokenList?.some(entry => entry.token === token && (!entry.status || entry.status === 'active') && (!claims.organizationId || !entry.organizationId || id(entry.organizationId) === id(claims.organizationId)));
    if (!active) throw httpError(401, 'Session expired. Please login again.');
    const membership = await repository.membership(user._id, claims.organizationId);
    if (!membership) throw httpError(403, 'User does not belong to this organization');
    if (claims.activeRoleId) {
      const assigned = membership.roleIds?.some(role => id(role) === id(claims.activeRoleId) && id(role.organizationId) === id(claims.organizationId) && role.status !== 'inactive');
      if (!assigned) throw httpError(403, 'Role not assigned in this organization');
    }
    return { userId: user._id, email: user.email, organizationId: claims.organizationId, roleIds: membership.roleIds.map(role => role._id), activeRoleId: claims.activeRoleId, mustChangePassword: Boolean(user.passwordChangeRequired) };
  },
});
