import { httpError } from '../../plugins/errors.js';

const normalizePlatform = value => {
  const platform = String(value || '').trim().toLowerCase();
  return platform === 'android' || platform === 'ios' ? platform : 'unknown';
};

const normalizeToken = value => String(value || '').trim();

export const createNotificationService = (models, { sendPushNotification = async () => ({ skipped: true, reason: 'provider_unavailable' }), emitNotification = () => {} } = {}) => {
  const sendPushNotificationSafe = async notification => {
    if (!notification?.recipientUserId) return;
    try {
      const user = await models.User.findById(notification.recipientUserId).select('pushTokens').lean();
      const tokens = (user?.pushTokens || []).map(item => item?.token).filter(Boolean);
      const result = await sendPushNotification({
        tokens,
        title: notification.title,
        message: notification.message,
        data: {
          notificationId: String(notification._id),
          type: notification.type,
          organizationId: String(notification.organizationId),
          recipientUserId: String(notification.recipientUserId),
        },
      });
      if (result?.invalidTokens?.length) {
        await models.User.updateOne({ _id: notification.recipientUserId }, { $pull: { pushTokens: { token: { $in: result.invalidTokens } } } });
      }
      if (result?.skipped) console.info('FCM push skipped:', result.reason, 'recipientUserId=', String(notification.recipientUserId));
      else if (result?.failureCount) console.warn('FCM push partially failed:', `success=${result.successCount || 0}`, `failure=${result.failureCount || 0}`, 'recipientUserId=', String(notification.recipientUserId));
    } catch (error) {
      console.warn('FCM push notification failed:', error?.message || error);
    }
  };

  const createNotification = async ({ organizationId, recipientUserId, recipientEmployeeId = null, actorEmployeeId = null, type = 'general', title, message, meta = {} }) => {
    if (!organizationId || !recipientUserId || !title || !message) return null;
    const notification = await models.Notification.create({ organizationId, recipientUserId, recipientEmployeeId, actorEmployeeId, type, title, message, meta });
    try { emitNotification({ organizationId, userId: recipientUserId }, notification); } catch { /* Realtime delivery is best-effort, as in v1. */ }
    void sendPushNotificationSafe(notification);
    return notification;
  };

  const createNotificationSafe = async payload => {
    try { return await createNotification(payload); } catch { return null; }
  };

  const getMyNotifications = async request => {
    const page = Math.max(1, Number(request.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(request.query.limit || 10)));
    const query = { organizationId: request.user.organizationId, recipientUserId: request.user.userId };
    if (String(request.query.onlyUnread || 'false') === 'true') query.isRead = false;
    const skip = (page - 1) * limit;
    const [items, total, unreadCount] = await Promise.all([
      models.Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      models.Notification.countDocuments(query),
      models.Notification.countDocuments({ organizationId: request.user.organizationId, recipientUserId: request.user.userId, isRead: false }),
    ]);
    return { items, page, limit, total, unreadCount };
  };

  const getMyUnreadCount = async request => ({ unreadCount: await models.Notification.countDocuments({ organizationId: request.user.organizationId, recipientUserId: request.user.userId, isRead: false }) });

  const markOneAsRead = async request => {
    const notification = await models.Notification.findOneAndUpdate(
      { _id: request.params.id, organizationId: request.user.organizationId, recipientUserId: request.user.userId },
      { $set: { isRead: true, readAt: new Date() } }, { new: true },
    );
    if (!notification) throw httpError(500, 'Notification not found');
    return notification;
  };

  const markAllAsRead = async request => {
    const result = await models.Notification.updateMany(
      { organizationId: request.user.organizationId, recipientUserId: request.user.userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
    return { updatedCount: result.modifiedCount || 0 };
  };

  const registerDeviceToken = async request => {
    const token = normalizeToken(request.body?.token);
    if (!token) throw httpError(400, 'FCM token is required');
    const userId = request.user.userId;
    await models.User.updateMany({ _id: { $ne: userId }, 'pushTokens.token': token }, { $pull: { pushTokens: { token } } });
    const timestamp = new Date();
    const updateResult = await models.User.updateOne({ _id: userId, 'pushTokens.token': token }, { $set: { 'pushTokens.$.platform': normalizePlatform(request.body?.platform), 'pushTokens.$.updatedAt': timestamp } });
    if (!updateResult.matchedCount) {
      await models.User.updateOne({ _id: userId }, { $push: { pushTokens: { token, platform: normalizePlatform(request.body?.platform), createdAt: timestamp, updatedAt: timestamp } } });
    }
    return { token };
  };

  const unregisterDeviceToken = async request => {
    const token = normalizeToken(request.body?.token);
    if (!token) throw httpError(400, 'FCM token is required');
    await models.User.updateOne({ _id: request.user.userId }, { $pull: { pushTokens: { token } } });
    return { token };
  };

  return { createNotification, createNotificationSafe, getMyNotifications, getMyUnreadCount, markOneAsRead, markAllAsRead, registerDeviceToken, unregisterDeviceToken };
};
