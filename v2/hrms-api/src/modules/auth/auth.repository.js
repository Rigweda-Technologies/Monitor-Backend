import mongoose from 'mongoose';
import { createModels } from './auth.models.js';
import { httpError } from '../../plugins/errors.js';
const validId = value => mongoose.isObjectIdOrHexString(value);
const clean = value => value?.toObject ? value.toObject() : value;

export const createAuthRepository = ({ connection }) => {
  const { User, Membership, Organization, Role, Permission, Employee, Settings } = createModels(connection);
  const memberships = async userId => Membership.find({ userId }).populate('organizationId').populate('roleIds');
  const role = async (id, organizationId) => validId(id) && validId(organizationId) ? Role.findOne({ _id: id, organizationId }) : null;
  return {
    userByEmail: email => User.findOne({ email }).select('+password'),
    userById: id => validId(id) ? User.findById(id).select('+password') : null,
    memberships,
    membership: async (userId, organizationId) => validId(organizationId) ? Membership.findOne({ userId, organizationId }).populate('organizationId').populate('roleIds') : null,
    organization: id => validId(id) ? Organization.findById(id) : null,
    role,
    roleBySlug: (organizationId, slug) => Role.findOne({ organizationId, slug }),
    roleBySlugInOrganization: (organizationId, slug) => Role.findOne({ organizationId, slug }).lean(),
    rolesByOrganization: organizationId => Role.find({ organizationId }).sort({ isSystemRole: -1, createdAt: 1 }).lean(),
    createRole: data => Role.create(data),
    roleInOrganization: (id, organizationId) => Role.findOne({ _id: id, organizationId }),
    updateRoleDocument: roleDocument => roleDocument.save(),
    organizationExists: id => Organization.exists({ _id: id }),
    permissionIdsInOrganization: (organizationId, ids) => Permission.find({ _id: { $in: ids }, organizationId }).select('_id'),
    updateLastRole: (userId, roleId) => User.updateOne({ _id: userId }, { $set: { lastActiveRoleId: roleId } }),
    permissions: (organizationId, ids) => Permission.find({ organizationId, _id: { $in: ids } }).select('code'),
    permissionsByOrganization: organizationId => Permission.find({ organizationId }).sort({ module: 1, code: 1 }),
    employee: (userId, organizationId, includeDeleted = false) => Employee.findOne({ userId, organizationId, ...(includeDeleted ? {} : { isDeleted: false }) }),
    settings: organizationId => Settings.findOne({ organizationId }).select('maxActiveLoginsPerUser'),
    addRole: (membershipId, roleId) => Membership.updateOne({ _id: membershipId }, { $addToSet: { roleIds: roleId } }),
    ensureMembership: async (userId, organizationId, roleId) => {
      try {
        return await Membership.findOneAndUpdate({ userId, organizationId }, { $addToSet: { roleIds: roleId } }, { upsert: true, returnDocument: 'after' });
      } catch (error) {
        if (error.code !== 11000) throw error;
        return Membership.findOneAndUpdate({ userId, organizationId }, { $addToSet: { roleIds: roleId } }, { returnDocument: 'after' });
      }
    },
    // Compare-and-set reads and writes raw BSON so Mongoose cannot add defaults to
    // legacy embedded token records during full-array equality matching.
    saveSession: async ({ userId, token, organizationId, activeRoleId, perOrgLimit, globalLimit, now }) => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const user = await User.collection.findOne({ _id: userId }, { projection: { tokenList: 1 } });
        if (!user) throw httpError(401, 'User not found');
        const entries = user.tokenList || [];
        const same = entries.filter(e => String(e.organizationId) === String(organizationId));
        const others = entries.filter(e => String(e.organizationId) !== String(organizationId));
        const orgId = typeof organizationId === 'string' ? new mongoose.Types.ObjectId(organizationId) : organizationId;
        const entry = { _id: new mongoose.Types.ObjectId(), token, organizationId: orgId, loginTimestamp: now.toISOString(), status: 'active' };
        const next = [...[entry, ...same].slice(0, perOrgLimit), ...others].slice(0, globalLimit);
        const filter = { _id: userId, ...(user.tokenList === undefined ? { tokenList: { $exists: false } } : { tokenList: entries }) };
        const result = await User.collection.updateOne(filter, { $set: { tokenList: next, activeOrganizationId: orgId, lastActiveRoleId: activeRoleId || null, lastLoginAt: now, updatedAt: now } });
        if (result.matchedCount) return;
      }
      throw httpError(503, 'Please try again.');
    },
    issueOtp: async (userId, otp, now) => {
      // Monotonic timestamp distinguishes even simultaneous identical random codes.
      const user = await User.findByIdAndUpdate(userId, [{ $set: { otp: { $literal: otp }, otpTimestamp: { $cond: [{ $gte: ['$otpTimestamp', now] }, { $add: ['$otpTimestamp', 1] }, now] }, otpAttempts: 0, resetPasswordVerifiedAt: null, resetPasswordVerifiedUntil: null, updatedAt: now } }], { returnDocument: 'after', updatePipeline: true }).lean();
      return user;
    },
    clearIssuedOtp: (userId, otp, timestamp) => User.updateOne({ _id: userId, otp, otpTimestamp: timestamp }, { $set: { otp: null, otpTimestamp: null, otpAttempts: 0 } }),
    incrementOtpAttempts: (user, now) => User.updateOne({ _id: user._id, otp: user.otp, otpTimestamp: user.otpTimestamp, $or: [{ otpAttempts: { $lt: 5 } }, { otpAttempts: { $exists: false } }] }, { $inc: { otpAttempts: 1 }, $set: { updatedAt: now } }),
    consumeOtp: async (user, now, forPasswordReset) => {
      const result = await User.updateOne({ _id: user._id, otp: user.otp, otpTimestamp: user.otpTimestamp, $or: [{ otpAttempts: { $lt: 5 } }, { otpAttempts: { $exists: false } }] }, { $set: { otp: null, otpTimestamp: null, otpAttempts: 0, ...(forPasswordReset ? { resetPasswordVerifiedAt: now, resetPasswordVerifiedUntil: new Date(now.getTime() + 600000) } : {}) } });
      return result.matchedCount > 0;
    },
    resetPassword: async (user, password, now) => {
      const result = await User.updateOne({ _id: user._id, password: user.password, resetPasswordVerifiedAt: user.resetPasswordVerifiedAt, resetPasswordVerifiedUntil: { $eq: user.resetPasswordVerifiedUntil, $gte: now } }, { $set: { password, passwordChangeRequired: false, passwordChangedAt: now, otp: null, otpTimestamp: null, otpAttempts: 0, resetPasswordVerifiedAt: null, resetPasswordVerifiedUntil: null } });
      return result.matchedCount > 0;
    },
  };
};
