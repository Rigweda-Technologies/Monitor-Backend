import crypto from 'node:crypto';
import { httpError } from '../../plugins/errors.js';

const parseVersion = version => String(version || '0.0.0').trim().split('.').map(part => Number.parseInt(part, 10) || 0);
const compareVersions = (left, right) => {
  const a = parseVersion(left); const b = parseVersion(right);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) { const delta = (a[i] || 0) - (b[i] || 0); if (delta) return delta; }
  return 0;
};
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const ensurePositiveInt = (value, fallback = 0) => { const parsed = Number.parseInt(value, 10); return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback; };
const releaseSortRank = release => ({ status: ({ active: 3, testing: 2, draft: 1, disabled: 0 })[String(release?.status || 'draft')] || 0, createdAt: new Date(release?.createdAt || 0).getTime(), releasedAt: new Date(release?.releasedAt || 0).getTime() });
const sortReleasesDesc = (a, b) => {
  const versionDelta = compareVersions(b.version, a.version); if (versionDelta) return versionDelta;
  const aRank = releaseSortRank(a); const bRank = releaseSortRank(b);
  if (bRank.status !== aRank.status) return bRank.status - aRank.status;
  if (bRank.releasedAt !== aRank.releasedAt) return bRank.releasedAt - aRank.releasedAt;
  return bRank.createdAt - aRank.createdAt;
};
const isEligible = (deviceId, release) => {
  const rollout = Number.isFinite(release?.rolloutPercentage) ? release.rolloutPercentage : 100;
  if (rollout >= 100) return true;
  const digest = crypto.createHash('sha256').update(`${deviceId}:${release._id}`).digest('hex');
  return Number.parseInt(digest.slice(0, 8), 16) % 100 < rollout;
};

export const createMonitorUpdateService = (models, { releaseStorage, defaultDownloadUrl = '' } = {}) => ({
  async listReleases() { const items = await models.MonitorRelease.find().sort({ createdAt: -1, build: -1 }).lean(); return items.sort(sortReleasesDesc); },
  async getLatestRelease({ deviceId, appVersion }) {
    const releases = await models.MonitorRelease.find({ channel: 'stable', status: { $in: ['testing','active'] } }).sort({ createdAt: -1, build: -1 }).lean();
    const latest = releases.sort(sortReleasesDesc)[0];
    if (!latest) return { updateAvailable: false, version: appVersion || '0.0.0' };
    const shouldUpdate = compareVersions(latest.version, appVersion || '0.0.0') > 0 && isEligible(deviceId, latest);
    if (!shouldUpdate) return { updateAvailable: false, version: appVersion || latest.version };
    return { updateAvailable: true, version: latest.version, build: latest.build, mandatory: Boolean(latest.mandatory), downloadUrl: latest.signedDownloadUrl || defaultDownloadUrl || '', sha256: latest.sha256, size: latest.fileSize, releaseId: String(latest._id), releasedAt: latest.releasedAt };
  },
  async recordUpdateStatus(payload) {
    return models.MonitorDeviceUpdate.findOneAndUpdate({ deviceId: payload.deviceId, releaseId: payload.releaseId || null }, { $set: {
      deviceId: payload.deviceId, employeeId: payload.employeeId || null, hostname: payload.hostname || null, currentVersion: payload.fromVersion || payload.currentVersion || null, targetVersion: payload.toVersion || payload.targetVersion || null, releaseId: payload.releaseId || null, updateStatus: payload.status, lastUpdateCheckAt: payload.timestamp ? new Date(payload.timestamp) : new Date(), updateStartedAt: payload.status === 'INSTALLING' ? new Date(payload.timestamp || Date.now()) : undefined, lastUpdatedAt: payload.status === 'UPDATED' ? new Date(payload.timestamp || Date.now()) : undefined, lastErrorCode: payload.errorCode || null, lastErrorMessage: payload.errorMessage || null,
    }, $inc: payload.status === 'FAILED' ? { failureCount: 1 } : { failureCount: 0 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  },
  async createRelease(payload) {
    const fileBuffer = payload.fileBase64 ? Buffer.from(String(payload.fileBase64).split(',').pop(), 'base64') : null;
    if (!fileBuffer?.length) throw httpError(400, 'fileBase64 is required');
    const version = String(payload.version || '').trim();
    if (!version) throw httpError(400, 'version is required');
    const build = ensurePositiveInt(payload.build, null);
    if (build === null) throw httpError(400, 'build is required');
    const fileSize = fileBuffer.length; const digest = sha256(fileBuffer); const objectKey = `stable/${version}/RigwedaMonitor-${version}.exe`;
    let signedDownloadUrl = '';
    if (releaseStorage) {
      const stored = await releaseStorage.uploadRelease({ fileBuffer, objectKey, version, fileName: `RigwedaMonitor-${version}.exe` });
      signedDownloadUrl = stored?.signedDownloadUrl || '';
    }
    const release = await models.MonitorRelease.create({ version, build, channel: payload.channel || 'stable', r2ObjectKey: objectKey, sha256: payload.sha256 || digest, fileSize, mandatory: Boolean(payload.mandatory), status: payload.status || 'draft', rolloutPercentage: ensurePositiveInt(payload.rolloutPercentage, 100), minimumSupportedVersion: payload.minimumSupportedVersion || '0.0.0', releasedAt: payload.releasedAt ? new Date(payload.releasedAt) : ['testing','active'].includes(String(payload.status || 'draft')) ? new Date() : null, signedDownloadUrl });
    return release.toObject();
  },
  async activateRelease({ releaseId, status, rolloutPercentage }) {
    const update = {};
    if (status) update.status = status;
    if (typeof rolloutPercentage !== 'undefined') update.rolloutPercentage = ensurePositiveInt(rolloutPercentage, 100);
    if (['testing','active'].includes(status) && !update.releasedAt) update.releasedAt = new Date();
    return models.MonitorRelease.findByIdAndUpdate(releaseId, { $set: update }, { new: true }).lean();
  },
});
