import mongoose from 'mongoose';

export const createMonitorUpdateModels = connection => {
  const releaseSchema = new mongoose.Schema({
    version: { type: String, required: true, trim: true }, build: { type: Number, required: true }, channel: { type: String, default: 'stable', trim: true }, r2ObjectKey: { type: String, required: true, trim: true }, sha256: { type: String, required: true, trim: true }, fileSize: { type: Number, required: true }, mandatory: { type: Boolean, default: false }, status: { type: String, enum: ['draft','testing','active','disabled'], default: 'draft' }, rolloutPercentage: { type: Number, default: 100, min: 0, max: 100 }, minimumSupportedVersion: { type: String, default: '0.0.0' }, releasedAt: { type: Date, default: null }, signedDownloadUrl: { type: String, default: null },
  }, { timestamps: true, autoCreate: false, autoIndex: false, bufferCommands: false });
  releaseSchema.index({ channel: 1, status: 1, releasedAt: -1 });
  const deviceUpdateSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, trim: true, index: true }, employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null }, hostname: { type: String, default: null, trim: true }, currentVersion: { type: String, default: null, trim: true }, targetVersion: { type: String, default: null, trim: true }, releaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'MonitorRelease', default: null }, updateStatus: { type: String, default: 'UP_TO_DATE', trim: true }, lastUpdateCheckAt: { type: Date, default: null }, updateStartedAt: { type: Date, default: null }, lastUpdatedAt: { type: Date, default: null }, failureCount: { type: Number, default: 0 }, lastErrorCode: { type: String, default: null, trim: true }, lastErrorMessage: { type: String, default: null, trim: true },
  }, { timestamps: true, autoCreate: false, autoIndex: false, bufferCommands: false });
  deviceUpdateSchema.index({ deviceId: 1, releaseId: 1 }, { unique: true, sparse: true });
  const MonitorRelease = connection.models.MonitorRelease || connection.model('MonitorRelease', releaseSchema);
  const MonitorDeviceUpdate = connection.models.MonitorDeviceUpdate || connection.model('MonitorDeviceUpdate', deviceUpdateSchema);
  return { MonitorRelease, MonitorDeviceUpdate };
};
