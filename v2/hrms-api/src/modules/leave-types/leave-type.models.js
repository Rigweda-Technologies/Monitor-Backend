import mongoose from 'mongoose';
import { createModels } from '../auth/auth.models.js';

export const createLeaveTypeModels = connection => {
  const models = createModels(connection);
  const objectId = mongoose.Schema.Types.ObjectId;
  const leaveTypeSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    name: { type: String, required: true, trim: true }, code: { type: String, required: true, uppercase: true },
    description: String, daysPerYear: { type: Number, default: 0 }, isCarryForward: { type: Boolean, default: false },
    includeInPayroll: { type: Boolean, default: true }, status: { type: String, enum: ['active','inactive'], default: 'active' },
    maxCarryForward: { type: Number, default: null },
  }, { timestamps: true, autoCreate: false, autoIndex: false });
  leaveTypeSchema.index({ organizationId: 1, code: 1 }, { unique: true });
  const balanceSchema = new mongoose.Schema({
    organizationId: { type: objectId, required: true, index: true }, employeeId: { type: objectId, required: true, index: true },
    leaveTypeId: { type: objectId, required: true }, cycleStartYear: { type: Number, required: true },
    total: { type: Number, required: true }, used: { type: Number, default: 0 }, pending: { type: Number, default: 0 },
    remaining: { type: Number, required: true }, lastCreditedAt: Date,
    carryForwardedFromCycleYears: { type: [Number], default: [], select: false },
  }, { collection: 'leave_balance', timestamps: true, autoCreate: false, autoIndex: false });
  balanceSchema.index({ organizationId: 1, employeeId: 1, leaveTypeId: 1, cycleStartYear: 1 }, { unique: true });
  const LeaveType = connection.models.leave_types || connection.model('leave_types', leaveTypeSchema, 'leave_types');
  const LeaveBalance = connection.models.leaveBalance || connection.model('leaveBalance', balanceSchema, 'leave_balance');
  return { ...models, LeaveType, LeaveBalance };
};
