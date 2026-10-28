import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { buildApp } from "../src/app.js";

const app = await buildApp({
  authenticateRequest: async () => {},
  activityService: { recordEvents: async () => ({ inserted: 0, saved: 0, duplicateCount: 0 }) },
  browserHistoryService: { recordEntries: async () => ({ inserted: 0, duplicateCount: 0 }) },
  appUsageService: { recordSessions: async () => ({ received: 0, employeeId: "test", organizationId: "test" }) },
  locationService: { receiveReport: async () => ({ success: true, message: "ok", data: {} }) },
  cloudinaryService: { getPublicUploadConfig: async () => ({ cloudName: "test", apiKey: "test", uploadFolderRoot: "test", screenshotsEnabled: true, mouseEnabled: true, keyboardEnabled: true, updatedAt: new Date().toISOString() }) },
  screenshotsService: { createUploadSession: async () => ({}), completeUploadSession: async () => ({}), createDirectScreenshot: async () => ({}) },
  logger: false,
  apiBaseUrl: "http://localhost:3002",
});

try {
  await app.ready();
  const outputPath = fileURLToPath(new URL("../../../hrms/back-end/src/openapi/monitor-v2.json", import.meta.url));
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(app.swagger(), null, 2)}\n`);
} finally {
  await app.close();
}
