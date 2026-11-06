import mongoose from 'mongoose';
import { createModels } from '../auth/auth.models.js';

export const createApprovalFlowModels = connection => {
  const objectId = mongoose.Schema.Types.ObjectId;
  const step = new mongoose.Schema({
    stepNumber: { type: Number, required: true, min: 1 },
    approverType: { type: String, enum: ['manager', 'role', 'employee'], required: true },
    roleSlug: { type: String, default: null },
    employeeId: { type: objectId, ref: 'employees', default: null },
  }, { _id: false });
  const schema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    moduleKey: { type: String, enum: ['leave', 'attendance_request'], required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    isActive: { type: Boolean, default: true },
    minDays: { type: Number, default: null }, maxDays: { type: Number, default: null },
    steps: { type: [step], default: [] },
  }, { timestamps: true, autoCreate: false, autoIndex: false });
  schema.index({ organizationId: 1, moduleKey: 1, isActive: 1 });
  const ApprovalFlow = connection.models.approval_flows || connection.model('approval_flows', schema, 'approval_flows');
  return { ...createModels(connection), ApprovalFlow };
};
