import mongoose from 'mongoose';

/**
 * Reuses HRMS models supplied by the application and declares the payroll
 * module's legacy attendance collection mapping without creating indexes.
 */
export const createPayrollModels = (connection, existingModels = {}) => {
  if (!connection) throw new TypeError('A connected Mongoose connection is required.');
  const schema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employees', required: true },
    date: Date, dateKey: String, checkInAt: Date, checkOutAt: Date,
    totalMinutes: { type: Number, default: 0 }, overtimeMinutes: { type: Number, default: 0 },
    lateByMinutes: { type: Number, default: 0 }, earlyCheckoutByMinutes: { type: Number, default: 0 },
    status: String, attendanceSource: String, workFromHomePortion: String,
  }, { collection: 'timesheet_attendance', autoCreate: false, autoIndex: false, strict: false });
  const Attendance = existingModels.Attendance || connection.models.timesheet_attendance || connection.model('timesheet_attendance', schema, 'timesheet_attendance');
  return { ...existingModels, Attendance };
};
