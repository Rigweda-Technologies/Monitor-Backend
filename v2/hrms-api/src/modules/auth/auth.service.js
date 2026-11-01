import { createLoginService } from './login.service.js';
import { createOtpService } from './otp.service.js';
import { createSelfieService } from './selfie.service.js';
import { httpError } from '../../plugins/errors.js';
export const createAuthService = dependencies => {
  const { repository, config } = dependencies;
  const login = createLoginService(dependencies);
  const otp = createOtpService(dependencies);
  const selfie = createSelfieService({ loginService: login, verifySelfie: dependencies.verifySelfie, allowFallback: config.face.fallback });
  return {
    login: login.login, loginWithSelfie: selfie.login, switchOrganization: login.switchOrganization,
    sendOtp: otp.send, verifyOtp: otp.verify, resetPassword: otp.reset,
    async profile(identity) {
      const user = await repository.userById(identity.userId);
      const employee = await repository.employee(identity.userId, identity.organizationId);
      return { email: user?.email || null, mustChangePassword: Boolean(user?.passwordChangeRequired),
        ...Object.fromEntries(['employeeId','firstName','lastName','employeeCode','managerId','profileImage'].map(key => [key, employee?.[key === 'employeeId' ? '_id' : key] || null])) };
    },
    async permissions(identity) {
      if (!identity.activeRoleId) throw httpError(403, 'Active role not set');
      const role = await repository.role(identity.activeRoleId, identity.organizationId);
      if (!role) throw httpError(404, 'Role not found');
      if (role.isSystemRole) return ['*'];
      if (!role.permissionIds?.length) return [];
      return (await repository.permissions(identity.organizationId, role.permissionIds)).map(p => p.code);
    },
    listPermissions: organizationId => repository.permissionsByOrganization(organizationId),
  };
};
