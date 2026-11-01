import { randomInt, timingSafeEqual } from 'node:crypto';
import { httpError } from '../../plugins/errors.js';
const normalize = email => String(email || '').toLowerCase().trim();
const same = (a, b) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
export const createOtpService = ({ repository, sendOtp, hashPassword, comparePassword, now = () => new Date(), generateOtp = () => String(randomInt(100000, 1000000)) }) => ({
  async send(email) {
    const user = await repository.userByEmail(normalize(email));
    if (!user) throw httpError(404, 'Email not registered');
    const otp = generateOtp();
    const issued = await repository.issueOtp(user._id, otp, now());
    if (!issued) throw httpError(404, 'User not found');
    // Legacy delivery failure is not a request failure. Preserve response, but never log the OTP.
    try { await sendOtp({ email: user.email, otp }); }
    catch { /* Delivery status is not exposed by the v1 contract; user may request another code. */ }
  },
  async verify({ email, otp, forPasswordReset = false }) {
    const user = await repository.userByEmail(normalize(email));
    if (!user) throw httpError(404, 'User not found');
    if (!user.otp || !user.otpTimestamp) throw httpError(400, 'OTP not found. Please request a new OTP.');
    if ((user.otpAttempts || 0) >= 5) throw httpError(429, 'Maximum OTP attempts exceeded. Please request a new OTP.');
    const timestamp = now();
    if (timestamp.getTime() - new Date(user.otpTimestamp).getTime() > 600000) throw httpError(400, 'OTP expired');
    if (!same(user.otp, otp)) {
      await repository.incrementOtpAttempts(user, timestamp);
      throw httpError(400, 'Invalid OTP');
    }
    if (!await repository.consumeOtp(user, timestamp, forPasswordReset)) throw httpError(400, 'OTP not found. Please request a new OTP.');
  },
  async reset({ email, password, confirmPassword }) {
    if (password !== confirmPassword) throw httpError(400, 'Confirm password must match password');
    const user = await repository.userByEmail(normalize(email));
    if (!user) throw httpError(404, 'User not found');
    const timestamp = now();
    if (!user.resetPasswordVerifiedUntil || new Date(user.resetPasswordVerifiedUntil) < timestamp) throw httpError(400, 'OTP verification expired. Please verify OTP again.');
    if (await comparePassword(password, user.password)) throw httpError(400, 'New password cannot be the same as current password');
    const hashed = await hashPassword(password);
    if (!await repository.resetPassword(user, hashed, now())) throw httpError(400, 'OTP verification expired. Please verify OTP again.');
  },
});
