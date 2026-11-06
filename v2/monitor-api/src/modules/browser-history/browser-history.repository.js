import { Prisma } from "@prisma/client";
import { lockAndAssertDeviceOwner } from "../device-ownership/device-ownership.repository.js";

export const createBrowserHistoryRepository = ({ prisma }) => ({
  async saveEntries({ organizationId, employeeId, employeeName, deviceId, entries }) {
    return prisma.$transaction(async (transaction) => {
      await lockAndAssertDeviceOwner({ transaction, deviceId, organizationId, employeeId });
      let inserted = 0;

      for (const entry of entries) {
        const rows = await transaction.$queryRaw(Prisma.sql`
          INSERT INTO monitor_browser_history (
            entry_id, organization_id, employee_id, employee_name, device_id,
            observed_at, browser, url, title, active_window_title, duration_ms
          ) VALUES (
            ${entry.entryId}, ${organizationId}, ${employeeId}, ${employeeName}, ${deviceId},
            ${entry.observedAt}::timestamptz, ${entry.browser}, ${entry.url}, ${entry.title},
            ${entry.activeWindowTitle}, ${entry.durationMs}
          )
          ON CONFLICT (device_id, entry_id) DO NOTHING
          RETURNING entry_id
        `);
        inserted += rows.length;
      }

      return { inserted, duplicateCount: entries.length - inserted };
    });
  },
});
