import "dotenv/config";
import { pathToFileURL } from "node:url";
import { loadConfig } from "./config/env.js";
import { createPrismaClient } from "./database/prisma.js";
import { createHrmsSessionVerifier } from "./integrations/hrms-session.js";
import { createAuthenticateRequest } from "./plugins/authentication.js";
import { createActivityRepository } from "./modules/activity/activity.repository.js";
import { createActivityService } from "./modules/activity/activity.service.js";
import { createBrowserHistoryRepository } from "./modules/browser-history/browser-history.repository.js";
import { createBrowserHistoryService } from "./modules/browser-history/browser-history.service.js";
import { createAppUsageRepository } from "./modules/app-usage/app-usage.repository.js";
import { createAppUsageService } from "./modules/app-usage/app-usage.service.js";
import { createLocationRepository } from "./modules/location/location.repository.js";
import { createLocationService } from "./modules/location/location.service.js";
import { v2 as cloudinary } from "cloudinary";
import { createCloudinaryProvider } from "./integrations/cloudinary-provider.js";
import { createCloudinaryRepository } from "./modules/cloudinary/cloudinary.repository.js";
import { createCloudinaryService } from "./modules/cloudinary/cloudinary.service.js";
import { createScreenshotsRepository } from "./modules/screenshots/screenshots.repository.js";
import { createScreenshotsService } from "./modules/screenshots/screenshots.service.js";
import { buildApp } from "./app.js";

export const startServer = async ({ config = loadConfig() } = {}) => {
  const prisma = createPrismaClient(config);
  const verifySession = createHrmsSessionVerifier({
    baseUrl: config.hrmsBackendUrl,
    timeoutMs: config.hrmsRequestTimeoutMs,
  });
  const activityRepository = createActivityRepository({ prisma });
  const activityService = createActivityService({ repository: activityRepository });
  const browserHistoryRepository = createBrowserHistoryRepository({ prisma });
  const browserHistoryService = createBrowserHistoryService({ repository: browserHistoryRepository });
  const appUsageRepository = createAppUsageRepository({ prisma });
  const appUsageService = createAppUsageService({ repository: appUsageRepository });
  const locationRepository = createLocationRepository({ prisma });
  const locationService = createLocationService({ repository: locationRepository });
  const cloudinaryProvider = createCloudinaryProvider({ client: cloudinary });
  const cloudinaryRepository = createCloudinaryRepository({ prisma });
  const cloudinaryService = createCloudinaryService({
    repository: cloudinaryRepository,
    provider: cloudinaryProvider,
    settingsSecret: config.monitorSettingsSecret,
  });
  const screenshotsRepository = createScreenshotsRepository({ prisma });
  const screenshotsService = createScreenshotsService({ repository: screenshotsRepository, cloudinaryService });
  const app = await buildApp({
    authenticateRequest: createAuthenticateRequest({ verifySession }),
    activityService,
    browserHistoryService,
    appUsageService,
    locationService,
    cloudinaryService,
    screenshotsService,
    isReady: async () => prisma.$queryRaw`SELECT 1`,
    apiBaseUrl: config.apiBaseUrl,
    corsOrigins: config.corsOrigins,
  });

  app.addHook("onClose", async () => prisma.$disconnect());
  await app.listen({ port: config.port, host: config.host });
  app.log.info({ host: config.host, port: config.port }, "Monitor API V2 started.");
  return app;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error) => {
    process.stderr.write(`Monitor API V2 startup failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
