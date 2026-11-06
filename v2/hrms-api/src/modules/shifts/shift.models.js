import mongoose from 'mongoose';
import { createModels } from '../auth/auth.models.js';

export const createShiftModels = connection => {
  const objectId = mongoose.Schema.Types.ObjectId;
  const shiftSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    startTime: { type: String, required: true }, endTime: { type: String, required: true },
    graceMinutes: { type: Number, default: 0, min: 0, max: 180 }, status: { type: String, enum: ['active','inactive'], default: 'active' },
  }, { timestamps: true, autoCreate: false, autoIndex: false });
  shiftSchema.index({ organizationId: 1, code: 1 }, { unique: true });
  const Shift = connection.models.shifts || connection.model('shifts', shiftSchema, 'shifts');
  return { ...createModels(connection), Shift };
};
