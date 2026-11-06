import mongoose from 'mongoose';

// Keep the physical collection and field names identical to HRMS v1.
export const createLeaveModels = connection => {
  const objectId = mongoose.Schema.Types.ObjectId;
  const approvalStepSchema = new mongoose.Schema({
    stepNumber: Number,
    approverType: { type: String, enum: ['manager', 'role', 'employee'] },
    approverEmployeeId: { type: objectId, ref: 'employees', default: null },
    approverRoleSlug: { type: String, default: null },
    status: { type: String, enum: ['queued', 'pending', 'approved', 'rejected'], default: 'queued' },
    actionBy: { type: objectId, ref: 'employees', default: null },
    actionByName: { type: String, default: null }, actionAt: { type: Date, default: null }, remarks: { type: String, default: null },
  }, { _id: false });
  const revertRequestSchema = new mongoose.Schema({
    fromDate: { type: Date, default: null }, toDate: { type: Date, default: null }, effectiveDateKeys: { type: [String], default: [] },
    totalDays: { type: Number, default: 0 }, reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedBy: { type: objectId, ref: 'employees', default: null }, requestedByName: { type: String, default: null }, requestedAt: { type: Date, default: null },
    actionBy: { type: objectId, ref: 'employees', default: null }, actionByName: { type: String, default: null }, actionAt: { type: Date, default: null }, rejectionReason: { type: String, default: '' },
  }, { _id: false });
  const schema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    employeeId: { type: objectId, ref: 'employees', required: true, index: true },
    leaveTypeId: { type: objectId, ref: 'leave_types', required: true },
    fromDate: { type: Date, required: true }, toDate: { type: Date, required: true },
    duration: { type: String, enum: ['full_day', 'half_day'], default: 'full_day' },
    halfDaySession: { type: String, enum: ['first_half', 'second_half', null], default: null },
    totalDays: { type: Number, required: true }, effectiveDateKeys: { type: [String], default: [] }, reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    actionBy: { type: objectId, ref: 'employees' }, actionByName: { type: String, default: null }, actionAt: Date, rejectionReason: String,
    approvalFlowId: { type: objectId, ref: 'approval_flows', default: null }, approvalSteps: { type: [approvalStepSchema], default: [] }, currentApprovalStep: { type: Number, default: null },
    revertRequest: { type: revertRequestSchema, default: null }, isDeleted: { type: Boolean, default: false },
  }, { timestamps: true, autoCreate: false, autoIndex: false });
  schema.pre(/^find/, function () { this.where({ isDeleted: false }); });
  schema.index({ organizationId: 1, isDeleted: 1, createdAt: -1 });
  schema.index({ organizationId: 1, employeeId: 1, createdAt: -1 });
  schema.index({ organizationId: 1, employeeId: 1, status: 1, fromDate: 1, toDate: 1, isDeleted: 1 });
  const Leave = connection.models.leaves || connection.model('leaves', schema, 'leaves');
  return { Leave };
};
