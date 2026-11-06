import https from 'node:https';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const privateKey = value => String(value || '').replace(/\\n/g, '\n').trim();
const asStringMap = value => Object.fromEntries(Object.entries(value || {}).filter(([, item]) => item !== undefined && item !== null).map(([key, item]) => [key, typeof item === 'string' ? item : JSON.stringify(item)]));

export const createFirebasePushSender = ({ config = {}, timeoutMs = 10000 } = {}) => {
  const agent = new https.Agent({ keepAlive: true, timeout: timeoutMs });
  const resolveAccount = () => {
    try {
      if (config.serviceAccountJson?.trim()) {
        const account = JSON.parse(config.serviceAccountJson);
        if (account.private_key) account.private_key = privateKey(account.private_key);
        return account;
      }
      const account = { project_id: String(config.projectId || '').trim(), client_email: String(config.clientEmail || '').trim(), private_key: privateKey(config.privateKey) };
      return account.project_id && account.client_email && account.private_key ? account : null;
    } catch { return null; }
  };
  let app;
  const getApp = account => {
    if (app) return app;
    app = getApps().find(candidate => candidate.name === 'hrms-v2') || initializeApp({ credential: cert(account), httpAgent: agent }, 'hrms-v2');
    return app;
  };
  return async ({ tokens = [], title, message, data = {} } = {}) => {
    const uniqueTokens = [...new Set(tokens.map(token => String(token || '').trim()).filter(Boolean))];
    if (!uniqueTokens.length) return { skipped: true, reason: 'no_tokens' };
    const account = resolveAccount();
    if (!account) return { skipped: true, reason: 'fcm_not_configured' };
    try {
      const task = getMessaging(getApp(account)).sendEachForMulticast({ tokens: uniqueTokens, notification: { title: String(title || '').trim(), body: String(message || '').trim() }, data: asStringMap(data), android: { priority: 'high', notification: { channelId: config.androidChannelId || 'rigweda-notifications', sound: 'default' } }, apns: { payload: { aps: { sound: 'default' } } } });
      let timeout;
      const response = await Promise.race([task, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('provider timeout')), timeoutMs); timeout.unref?.(); })]).finally(() => clearTimeout(timeout));
      const invalidTokens = response.responses.flatMap((result, index) => ['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(result.error?.code) ? [uniqueTokens[index]] : []);
      return { ok: response.successCount > 0, successCount: response.successCount, failureCount: response.failureCount, invalidTokens };
    } catch { return { skipped: true, reason: 'provider_unavailable' }; }
  };
};
