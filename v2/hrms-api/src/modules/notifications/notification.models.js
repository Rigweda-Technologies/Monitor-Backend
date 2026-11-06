import mongoose from 'mongoose';
import { createModels } from '../auth/auth.models.js';

const pushTokensSchema = [{
  token: { type: String, trim: true },
  platform: { type: String, enum: ['android', 'ios', 'unknown'], default: 'unknown' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}];

export const createNotificationModels = connection => {
  const models = createModels(connection);
  if (!models.User.schema.path('pushTokens')) models.User.schema.add({ pushTokens: pushTokensSchema });
  const objectId = mongoose.Schema.Types.ObjectId;
  const schema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    recipientUserId: { type: objectId, ref: 'users', required: true, index: true },
    recipientEmployeeId: { type: objectId, ref: 'employees', default: null },
    actorEmployeeId: { type: objectId, ref: 'employees', default: null },
    type: { type: String, enum: ['leave_applied', 'leave_pending_approval', 'leave_action', 'attendance_request_pending_approval', 'attendance_request_action', 'attendance_override', 'probation_completed', 'employee_lifecycle', 'organization_document_expiry', 'general'], default: 'general' },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  }, { timestamps: true, autoCreate: false, autoIndex: false });
  schema.index({ organizationId: 1, recipientUserId: 1, createdAt: -1 });
  schema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
  schema.set('bufferCommands', false);
  const Notification = connection.models.notifications || connection.model('notifications', schema, 'notifications');
  return { ...models, Notification };
};
