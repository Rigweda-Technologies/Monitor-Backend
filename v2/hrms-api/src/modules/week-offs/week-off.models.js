import mongoose from 'mongoose';
import { createModels } from '../auth/auth.models.js';
import { createShiftModels } from '../shifts/shift.models.js';

export const createWeekOffModels = connection => {
  const objectId = mongoose.Schema.Types.ObjectId;
  const weekOffSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true },
    shiftId: { type: objectId, ref: 'shifts', default: null }, weekOffDays: { type: [Number], required: true },
  }, { collection: 'week_off', timestamps: true, autoCreate: false, autoIndex: false });
  weekOffSchema.index({ organizationId: 1, shiftId: 1 }, { unique: true });
  const WeekOff = connection.models.weekOff || connection.model('weekOff', weekOffSchema, 'week_off');
  return { ...createModels(connection), ...createShiftModels(connection), WeekOff };
};
