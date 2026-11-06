import { httpError } from '../../plugins/errors.js';
export const createSelfieService = ({ loginService, verifySelfie, allowFallback = false }) => ({
  async login(input) {
    const context = await loginService.resolve(input);
    if (!context.employee?.profileImage) throw httpError(400, 'Profile photo is not available. Contact admin before using selfie login.');
    let confidence = null;
    let reason = null;
    try { ({ confidence } = await verifySelfie({ profileImageUrl: context.employee.profileImage, selfieImage: input.selfieImage, livenessSelfieImage: input.livenessSelfieImage })); }
    catch (error) {
      if (!allowFallback || ![502, 503].includes(error.statusCode)) throw error;
      reason = error.publicMessage || 'Face verification unavailable';
    }
    return { ...await loginService.finish(context), selfieVerificationBypassed: reason !== null, selfieVerificationBypassReason: reason, faceMatchConfidence: confidence };
  },
});
