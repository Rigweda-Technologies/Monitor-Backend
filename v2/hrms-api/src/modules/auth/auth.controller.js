import { success } from '../../plugins/errors.js';
export const createAuthController = service => {
  const session = (operation, message) => async (request, reply) => {
    const result = await operation(request);
    const { token, ...data } = result;
    reply.header('Authorization', token);
    return success(data, message);
  };
  const otp = (operation, message) => async request => { await operation(request); return success(null, message); };
  return {
    login: session(r => service.login(r.body), 'Login successful'),
    loginWithSelfie: session(r => service.loginWithSelfie(r.body), 'Selfie login successful'),
    switchOrganization: session(r => service.switchOrganization(r.user, r.body), 'Context switched successfully'),
    profile: async r => success(await service.profile(r.user)),
    permissions: async r => success(await service.permissions(r.user)),
    sendOtp: otp(r => service.sendOtp(r.body.email), 'OTP sent successfully'),
    verifyOtp: otp(r => service.verifyOtp(r.body), 'OTP verified successfully'),
    verifyResetOtp: otp(r => service.verifyOtp({ ...r.body, forPasswordReset: true }), 'OTP verified successfully'),
    reset: otp(r => service.resetPassword(r.body), 'Password updated successfully'),
    sendChangeOtp: otp(r => service.sendOtp(r.user.email), 'OTP sent successfully'),
    verifyChangeOtp: otp(r => service.verifyOtp({ email: r.user.email, otp: r.body.otp, forPasswordReset: true }), 'OTP verified successfully'),
    change: otp(r => service.resetPassword({ ...r.body, email: r.user.email }), 'Password updated successfully'),
  };
};
