import mongoose from 'mongoose';
import { createDepartmentModels } from '../departments/department.models.js';

export const createDesignationModels = connection => {
  const objectId = mongoose.Schema.Types.ObjectId;
  const designationSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    name: { type: String, required: true, trim: true }, level: Number,
    departmentId: { type: objectId, ref: 'departments', required: true },
    status: { type: String, enum: ['active','inactive'], default: 'active' },
    isDeleted: { type: Boolean, default: false }, deletedAt: Date, deletedBy: { type: objectId, ref: 'users' },
  }, { timestamps: true, autoCreate: false, autoIndex: false });
  designationSchema.index({ organizationId: 1, name: 1 }, { unique: true });
  designationSchema.pre(/^find/, function () { this.where({ isDeleted: false }); });
  const Designation = connection.models.designations || connection.model('designations', designationSchema, 'designations');
  return { ...createDepartmentModels(connection), Designation };
};
