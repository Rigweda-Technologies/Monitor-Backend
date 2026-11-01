import { failure, success } from '../../plugins/errors.js';

const envelope = { type: 'object', properties: { success: { type: 'boolean' }, code: { type: 'integer' }, message: { type: 'string' }, data: {}, error: {} }, required: ['success', 'code', 'message', 'data', 'error'] };
const tokenBody = { type: 'object', additionalProperties: false, required: ['token'], properties: { token: { type: 'string', minLength: 1 }, platform: { type: 'string' } } };

export const registerNotificationRoutes = async (app, { service, authenticate, authorize }) => {
  const routes = [
    { method: 'GET', url: '/my', permission: 'NOTIFICATION_VIEW_SELF', summary: 'List the authenticated user notifications', operation: 'list', querystring: { type: 'object', properties: { page: { type: 'string' }, limit: { type: 'string' }, onlyUnread: { type: 'string' } } } },
    { method: 'GET', url: '/unread-count', permission: 'NOTIFICATION_VIEW_SELF', summary: 'Get the authenticated user unread notification count', operation: 'unreadCount' },
    { method: 'PATCH', url: '/:id/read', permission: 'NOTIFICATION_MANAGE_SELF', summary: 'Mark one owned notification as read', operation: 'markRead', params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } },
    { method: 'PATCH', url: '/read-all', permission: 'NOTIFICATION_MANAGE_SELF', summary: 'Mark all owned notifications as read', operation: 'markAllRead' },
    { method: 'POST', url: '/device-token/register', permission: 'NOTIFICATION_MANAGE_SELF', summary: 'Register an FCM device token for the authenticated user', operation: 'registerToken', body: tokenBody },
    { method: 'POST', url: '/device-token/unregister', permission: 'NOTIFICATION_MANAGE_SELF', summary: 'Remove an FCM device token from the authenticated user', operation: 'unregisterToken', body: tokenBody },
  ];
  for (const route of routes) {
    const schema = {
      tags: ['Notifications'], summary: route.summary, security: [{ bearerAuth: [] }],
      ...(route.params ? { params: route.params } : {}), ...(route.querystring ? { querystring: route.querystring } : {}), ...(route.body ? { body: route.body } : {}),
      response: { 200: envelope, 400: envelope, 401: envelope, 403: envelope, 500: envelope },
    };
    app.route({
      method: route.method, url: `/api/v2/notifications${route.url}`, schema,
      validatorCompiler: () => data => ({ value: data }),
      preValidation: [authenticate, async (request, reply) => {
        const denied = await authorize(route.permission, request);
        if (denied) return reply.code(denied.code).send(failure(denied.code, denied.message));
        if (route.body && !String(request.body?.token || '').trim()) return reply.code(400).send(failure(400, 'FCM token is required'));
      }],
      handler: async (request, reply) => {
        if (route.operation === 'list') return reply.code(200).send(success(await service.getMyNotifications(request)));
        if (route.operation === 'unreadCount') return reply.code(200).send(success(await service.getMyUnreadCount(request)));
        if (route.operation === 'markRead') return reply.code(200).send(success(await service.markOneAsRead(request), 'Notification marked as read'));
        if (route.operation === 'markAllRead') return reply.code(200).send(success(await service.markAllAsRead(request), 'All notifications marked as read'));
        if (route.operation === 'registerToken') return reply.code(200).send(success(await service.registerDeviceToken(request), 'FCM device token saved'));
        return reply.code(200).send(success(await service.unregisterDeviceToken(request), 'FCM device token removed'));
      },
    });
  }
};
