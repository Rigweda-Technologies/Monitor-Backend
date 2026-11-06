import mongoose from 'mongoose';

// Mongoose models point at the existing HRMS collections and preserve their field names.
export const createTimesheetModels = connection => {
  const objectId = mongoose.Schema.Types.ObjectId;
  const entrySchema = new mongoose.Schema({ date: { type: Date, required: true }, hours: { type: Number, required: true, min: 0, max: 24 }, notes: { type: String, trim: true, default: '' } }, { _id: false });
  const timesheetSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    employeeId: { type: objectId, ref: 'employees', required: true, index: true },
    weekStart: { type: Date, required: true, index: true }, weekEnd: { type: Date, required: true },
    entries: { type: [entrySchema], default: [] }, totalHours: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },
    submittedAt: Date, actionBy: { type: objectId, ref: 'employees' }, actionAt: Date, rejectionReason: String,
  }, { timestamps: true, autoCreate: false, autoIndex: false, bufferCommands: false });
  timesheetSchema.index({ organizationId: 1, employeeId: 1, weekStart: 1 }, { unique: true });

  const attendanceHistorySchema = new mongoose.Schema({
    action: { type: String, enum: ['check_in', 'check_out'], required: true }, at: { type: Date, required: true },
    ip: { type: String, default: null }, latitude: { type: Number, default: null }, longitude: { type: Number, default: null },
    selfieProvided: { type: Boolean, default: false }, selfieImage: { type: String, default: null },
    deviceId: { type: String, default: null }, source: { type: String, default: 'web' },
  });
  const attendanceSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true }, employeeId: { type: objectId, ref: 'employees', required: true, index: true },
    date: { type: Date, required: true, index: true }, dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    checkInAt: Date, checkInIp: { type: String, default: null }, checkInLatitude: { type: Number, default: null }, checkInLongitude: { type: Number, default: null },
    checkInSelfieProvided: { type: Boolean, default: false }, checkInSelfieImage: { type: String, default: null }, checkInDeviceId: { type: String, default: null },
    checkOutAt: Date, checkOutIp: { type: String, default: null }, checkOutSelfieProvided: { type: Boolean, default: false }, checkOutSelfieImage: { type: String, default: null }, checkOutDeviceId: { type: String, default: null },
    dayHistory: { type: [attendanceHistorySchema], default: [] }, totalMinutes: { type: Number, default: 0 },
    attendanceSource: { type: String, enum: ['manual', 'monitor_agent', 'biometric', 'access_card'], default: 'manual', index: true },
    workFromHomePortion: { type: String, enum: ['full_day', 'first_half', 'second_half'], default: null },
    status: { type: String, enum: ['checked_in', 'checked_out'], default: 'checked_in' },
    overriddenBy: { type: objectId, ref: 'employees', default: null }, overriddenAt: { type: Date, default: null },
    shiftId: { type: objectId, ref: 'shifts', default: null }, shiftName: { type: String, default: null }, shiftCode: { type: String, default: null }, shiftStartTime: { type: String, default: null }, shiftEndTime: { type: String, default: null },
    scheduledStartAt: { type: Date, default: null }, scheduledEndAt: { type: Date, default: null }, lateByMinutes: { type: Number, default: 0 }, earlyLoginByMinutes: { type: Number, default: 0 }, earlyCheckoutByMinutes: { type: Number, default: 0 }, overtimeMinutes: { type: Number, default: 0 },
    missedCheckout: { type: Boolean, default: false }, missedCheckoutMarkedAt: { type: Date, default: null }, missedCheckoutResolvedRequestId: { type: objectId, ref: 'attendance_requests', default: null },
  }, { timestamps: true, autoCreate: false, autoIndex: false, bufferCommands: false });
  attendanceSchema.index({ organizationId: 1, employeeId: 1, dateKey: 1 }, { unique: true, name: 'uniq_org_employee_dateKey_non_null', partialFilterExpression: { dateKey: { $type: 'string' } } });
  attendanceSchema.index({ organizationId: 1, dateKey: 1 }); attendanceSchema.index({ organizationId: 1, dateKey: 1, checkInAt: -1 });

  const approvalStepSchema = new mongoose.Schema({
    stepNumber: Number, approverType: { type: String, enum: ['manager', 'role', 'employee'] }, approverEmployeeId: { type: objectId, ref: 'employees', default: null }, approverRoleSlug: { type: String, default: null },
    status: { type: String, enum: ['queued', 'pending', 'approved', 'rejected'], default: 'queued' }, actionBy: { type: objectId, ref: 'employees', default: null }, actionAt: { type: Date, default: null }, remarks: { type: String, default: null },
  }, { _id: false });
  const requestSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true }, employeeId: { type: objectId, ref: 'employees', required: true, index: true },
    date: { type: String, required: true, index: true, match: /^\d{4}-\d{2}-\d{2}$/ }, requestType: { type: String, enum: ['missed_checkout', 'correction', 'work_from_home'], required: true },
    dayPortion: { type: String, enum: ['full_day', 'first_half', 'second_half'], default: 'full_day' }, requestedCheckInTime: { type: String, default: null }, requestedCheckOutTime: { type: String, default: null },
    reason: { type: String, required: true, trim: true }, status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    actionBy: { type: objectId, ref: 'employees', default: null }, actionAt: { type: Date, default: null }, rejectionReason: { type: String, default: null },
    resolvedAttendanceId: { type: objectId, ref: 'timesheet_attendance', default: null }, approvalFlowId: { type: objectId, ref: 'approval_flows', default: null },
    approvalSteps: { type: [approvalStepSchema], default: [] }, currentApprovalStep: { type: Number, default: null },
  }, { timestamps: true, autoCreate: false, autoIndex: false, bufferCommands: false });
  requestSchema.index({ organizationId: 1, employeeId: 1, date: 1, status: 1 });

  const Timesheet = connection.models.timesheets || connection.model('timesheets', timesheetSchema, 'timesheets');
  const Attendance = connection.models.timesheet_attendance || connection.model('timesheet_attendance', attendanceSchema, 'timesheet_attendance');
  const AttendanceRequest = connection.models.attendance_requests || connection.model('attendance_requests', requestSchema, 'attendance_requests');
  return { Timesheet, Attendance, AttendanceRequest };
};
