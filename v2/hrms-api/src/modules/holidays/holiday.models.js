import mongoose from 'mongoose';
import { createDepartmentModels } from '../departments/department.models.js';

export const createHolidayModels = connection => {
  const objectId = mongoose.Schema.Types.ObjectId;
  const holidaySchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    name: { type: String, required: true, trim: true }, date: { type: Date, required: true }, year: { type: Number, required: true, index: true },
    status: { type: String, enum: ['active','inactive'], default: 'active' }, isDeleted: { type: Boolean, default: false },
  }, { timestamps: true, autoCreate: false, autoIndex: false });
  holidaySchema.index({ organizationId: 1, date: 1, year: 1 }, { unique: true });
  holidaySchema.pre(/^find/, function () { this.where({ isDeleted: false }); });
  const Holiday = connection.models.holidays || connection.model('holidays', holidaySchema, 'holidays');
  return { ...createDepartmentModels(connection), Holiday };
};
