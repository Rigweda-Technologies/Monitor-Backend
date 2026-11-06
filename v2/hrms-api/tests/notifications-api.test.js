import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import mongoose from 'mongoose';
import swagger from '@fastify/swagger';
import { registerNotificationRoutes } from '../src/modules/notifications/notification.routes.js';
import { createNotificationModels } from '../src/modules/notifications/notification.models.js';
import { createNotificationService } from '../src/modules/notifications/notification.service.js';

const setup = async () => {
  const calls = [];
  const app = Fastify({ logger: false });
  await app.register(swagger, { openapi: { info: { title: 'test', version: '1' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } } });
  await registerNotificationRoutes(app, {
    authenticate: async request => { request.user = { userId: 'user-1', organizationId: 'org-1' }; },
    authorize: async permission => { calls.push(permission); return null; },
    service: {
      getMyNotifications: async request => ({ items: [], page: Number(request.query.page), limit: Number(request.query.limit), total: 0, unreadCount: 3 }),
      getMyUnreadCount: async () => ({ unreadCount: 3 }),
      markOneAsRead: async request => ({ _id: request.params.id, isRead: true }),
      markAllAsRead: async () => ({ updatedCount: 2 }),
      registerDeviceToken: async request => ({ token: request.body.token, platform: request.body.platform || 'unknown' }),
      unregisterDeviceToken: async request => ({ token: request.body.token }),
    },
  });
  await app.ready();
  return { app, calls };
};

test('notification routes preserve self-service permissions and response envelopes', async t => {
  const { app, calls } = await setup();
  t.after(() => app.close());
  const headers = { authorization: 'Bearer opaque' };
  const expected = [
    ['GET', '/api/v2/notifications/my'], ['GET', '/api/v2/notifications/unread-count'],
    ['PATCH', '/api/v2/notifications/:id/read'], ['PATCH', '/api/v2/notifications/read-all'],
    ['POST', '/api/v2/notifications/device-token/register'], ['POST', '/api/v2/notifications/device-token/unregister'],
  ];
  for (const [method, url] of expected) assert.ok(app.hasRoute({ method, url }), `missing ${method} ${url}`);

  const list = await app.inject({ method: 'GET', url: '/api/v2/notifications/my?page=1&limit=10&onlyUnread=true', headers });
  assert.equal(list.statusCode, 200);
  assert.deepEqual(list.json(), { success: true, code: 200, message: 'Success', data: { items: [], page: 1, limit: 10, total: 0, unreadCount: 3 }, error: null });
  assert.deepEqual((await app.inject({ method: 'GET', url: '/api/v2/notifications/unread-count', headers })).json().data, { unreadCount: 3 });
  assert.equal((await app.inject({ method: 'PATCH', url: '/api/v2/notifications/notif-1/read', headers })).json().message, 'Notification marked as read');
  assert.equal((await app.inject({ method: 'PATCH', url: '/api/v2/notifications/read-all', headers })).json().data.updatedCount, 2);
  assert.equal((await app.inject({ method: 'POST', url: '/api/v2/notifications/device-token/register', headers, payload: { token: 'device-token' } })).json().data.token, 'device-token');
  assert.equal((await app.inject({ method: 'POST', url: '/api/v2/notifications/device-token/unregister', headers, payload: { token: 'device-token' } })).json().data.token, 'device-token');
  assert.deepEqual(calls, ['NOTIFICATION_VIEW_SELF', 'NOTIFICATION_VIEW_SELF', 'NOTIFICATION_MANAGE_SELF', 'NOTIFICATION_MANAGE_SELF', 'NOTIFICATION_MANAGE_SELF', 'NOTIFICATION_MANAGE_SELF']);
  const paths = app.swagger().paths;
  assert.ok(paths['/api/v2/notifications/my'].get.responses['200']);
  assert.ok(paths['/api/v2/notifications/{id}/read'].patch);
  assert.ok(paths['/api/v2/notifications/device-token/register'].post);
  assert.ok(paths['/api/v2/notifications/device-token/unregister'].post);
});

test('device-token routes reject missing tokens before calling the service', async t => {
  const { app } = await setup();
  t.after(() => app.close());
  const response = await app.inject({ method: 'POST', url: '/api/v2/notifications/device-token/register', payload: {}, headers: { authorization: 'Bearer opaque' } });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().message, 'FCM token is required');
});

test('notification creation sends the legacy FCM payload and removes invalid device tokens', async () => {
  const calls = [];
  const models = {
    Notification: { create: async payload => ({ ...payload, _id: 'notification-1' }) },
    User: {
      findById: () => ({ select: () => ({ lean: async () => ({ pushTokens: [{ token: 'valid' }, { token: 'invalid' }] }) }) }),
      updateOne: async (...args) => { calls.push(args); return {}; },
    },
  };
  let senderPayload, realtimeEvent;
  const service = createNotificationService(models, { sendPushNotification: async payload => { senderPayload = payload; return { successCount: 1, failureCount: 1, invalidTokens: ['invalid'] }; }, emitNotification: (identity, payload) => { realtimeEvent = { identity, payload }; } });
  const notification = await service.createNotification({ organizationId: 'org-1', recipientUserId: 'user-1', title: 'Hello', message: 'World' });
  assert.equal(notification._id, 'notification-1');
  assert.deepEqual(realtimeEvent, { identity: { organizationId: 'org-1', userId: 'user-1' }, payload: notification });
  for (let attempt = 0; attempt < 20 && !calls.length; attempt += 1) await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(senderPayload, { tokens: ['valid', 'invalid'], title: 'Hello', message: 'World', data: { notificationId: 'notification-1', type: 'general', organizationId: 'org-1', recipientUserId: 'user-1' } });
  assert.deepEqual(calls[0], [{ _id: 'user-1' }, { $pull: { pushTokens: { token: { $in: ['invalid'] } } } }]);
});

test('notification persistence maps the legacy collection, indexes, and user push-token field', async () => {
  const connection = mongoose.createConnection();
  try {
    const models = createNotificationModels(connection);
    assert.equal(models.Notification.collection.collectionName, 'notifications');
    const indexes = models.Notification.schema.indexes().map(([keys]) => keys);
    assert.ok(indexes.some(keys => keys.organizationId === 1 && keys.recipientUserId === 1 && keys.createdAt === -1));
    assert.ok(indexes.some(keys => keys.recipientUserId === 1 && keys.isRead === 1 && keys.createdAt === -1));
    assert.ok(models.User.schema.path('pushTokens'));
  } finally {
    await connection.close();
  }
});
