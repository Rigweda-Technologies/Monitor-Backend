import { Prisma } from "@prisma/client";
import { DeviceOwnershipConflictError } from "../../errors.js";

export const lockAndAssertDeviceOwner = async ({ transaction, deviceId, organizationId, employeeId }) => {
  await transaction.$queryRaw(Prisma.sql`
    WITH device_lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(hashtext(${deviceId})::bigint)
    )
    SELECT TRUE AS lock_acquired FROM device_lock
  `);

  const conflicts = await transaction.$queryRaw(Prisma.sql`
    SELECT 1 AS conflict
    FROM monitor_device_presence
    WHERE device_id = ${deviceId}
      AND (
        employee_id <> ${employeeId}
        OR (organization_id IS NOT NULL AND organization_id <> ${organizationId})
      )
    UNION ALL
    SELECT 1 AS conflict
    FROM monitor_browser_history
    WHERE device_id = ${deviceId}
      AND (
        employee_id <> ${employeeId}
        OR (organization_id IS NOT NULL AND organization_id <> ${organizationId})
      )
    UNION ALL
    SELECT 1 AS conflict
    FROM monitor_activity_events
    WHERE device_id = ${deviceId}
      AND (
        employee_id <> ${employeeId}
        OR (organization_id IS NOT NULL AND organization_id <> ${organizationId})
      )
    UNION ALL
    SELECT 1 AS conflict
    FROM monitor_app_usage_sessions
    WHERE device_id = ${deviceId}
      AND (
        employee_id <> ${employeeId}
        OR (organization_id IS NOT NULL AND organization_id <> ${organizationId})
      )
    UNION ALL
    SELECT 1 AS conflict
    FROM monitor_screenshot_batches
    WHERE device_id = ${deviceId}
      AND (
        employee_id <> ${employeeId}
        OR (organization_id IS NOT NULL AND organization_id <> ${organizationId})
      )
    UNION ALL
    SELECT 1 AS conflict
    FROM monitor_screenshots
    WHERE device_id = ${deviceId}
      AND (
        employee_id <> ${employeeId}
        OR (organization_id IS NOT NULL AND organization_id <> ${organizationId})
      )
    LIMIT 1
  `);

  if (conflicts.length > 0) throw new DeviceOwnershipConflictError();
};

export const lockAndAssertDeviceOwners = async ({ transaction, deviceIds, organizationId, employeeId }) => {
  for (const deviceId of [...new Set(deviceIds)].sort()) {
    await lockAndAssertDeviceOwner({ transaction, deviceId, organizationId, employeeId });
  }
};
