import { Prisma } from "@prisma/client";
import { DeviceOwnershipConflictError } from "../../errors.js";
import { lockAndAssertDeviceOwners } from "../device-ownership/device-ownership.repository.js";
import { buildDailyKey, toDateKeyInTimeZone } from "./activity.service.js";

export const createActivityRepository = ({ prisma }) => ({
  async saveEvents({ organizationId, employeeId, employeeName, activityTimeZone, events }) {
    return prisma.$transaction(async (transaction) => {
      let saved = 0;
      let duplicateCount = 0;

      await lockAndAssertDeviceOwners({
        transaction,
        deviceIds: events.map((event) => event.deviceId),
        organizationId,
        employeeId,
      });

      for (const event of events) {
        const activityDate = toDateKeyInTimeZone(event.observedAt, activityTimeZone);
        const dailyKey = buildDailyKey({ organizationId, employeeId, activityDate });
        const activityRows = await transaction.$queryRaw(Prisma.sql`
          INSERT INTO monitor_activity_events (
            id, daily_key, organization_id, employee_id, employee_name, device_id,
            activity_date, observed_at, status, active_seconds, idle_seconds, event_ids
          ) VALUES (
            ${event.eventId}, ${dailyKey}, ${organizationId}, ${employeeId}, ${employeeName}, ${event.deviceId},
            ${activityDate}::date, ${event.observedAt}::timestamptz, ${event.status},
            ${event.activeSeconds}, ${event.idleSeconds}, ARRAY[${event.eventId}]::text[]
          )
          ON CONFLICT (daily_key) WHERE daily_key IS NOT NULL DO UPDATE SET
            employee_name = COALESCE(EXCLUDED.employee_name, monitor_activity_events.employee_name),
            device_id = CASE
              WHEN EXCLUDED.observed_at >= monitor_activity_events.observed_at THEN EXCLUDED.device_id
              ELSE monitor_activity_events.device_id
            END,
            observed_at = GREATEST(monitor_activity_events.observed_at, EXCLUDED.observed_at),
            status = CASE
              WHEN EXCLUDED.observed_at >= monitor_activity_events.observed_at THEN EXCLUDED.status
              ELSE monitor_activity_events.status
            END,
            active_seconds = CASE
              WHEN monitor_activity_events.event_ids @> ARRAY[EXCLUDED.id]::text[] THEN monitor_activity_events.active_seconds
              ELSE monitor_activity_events.active_seconds + EXCLUDED.active_seconds
            END,
            idle_seconds = CASE
              WHEN monitor_activity_events.event_ids @> ARRAY[EXCLUDED.id]::text[] THEN monitor_activity_events.idle_seconds
              ELSE monitor_activity_events.idle_seconds + EXCLUDED.idle_seconds
            END,
            event_ids = CASE
              WHEN monitor_activity_events.event_ids @> ARRAY[EXCLUDED.id]::text[] THEN monitor_activity_events.event_ids
              ELSE array_append(monitor_activity_events.event_ids, EXCLUDED.id)
            END
          WHERE NOT (monitor_activity_events.event_ids @> ARRAY[EXCLUDED.id]::text[])
          RETURNING xmax = 0 AS inserted
        `);

        if (activityRows.length > 0) {
          saved += 1;
        } else {
          duplicateCount += 1;
        }

        const presenceRows = await transaction.$queryRaw(Prisma.sql`
          INSERT INTO monitor_device_presence (
            device_id, organization_id, employee_id, employee_name, status, last_seen_at
          ) VALUES (
            ${event.deviceId}, ${organizationId}, ${employeeId}, ${employeeName}, ${event.status},
            CASE
              WHEN ${event.observedAt}::timestamptz BETWEEN NOW() - (120 * INTERVAL '1 second') AND NOW() + INTERVAL '1 minute'
              THEN NOW()
              ELSE ${event.observedAt}::timestamptz
            END
          )
          ON CONFLICT (device_id) DO UPDATE SET
            employee_name = COALESCE(EXCLUDED.employee_name, monitor_device_presence.employee_name),
            status = CASE
              WHEN EXCLUDED.last_seen_at >= monitor_device_presence.last_seen_at THEN EXCLUDED.status
              ELSE monitor_device_presence.status
            END,
            last_seen_at = GREATEST(monitor_device_presence.last_seen_at, EXCLUDED.last_seen_at),
            updated_at = NOW()
          WHERE monitor_device_presence.organization_id IS NOT DISTINCT FROM EXCLUDED.organization_id
            AND monitor_device_presence.employee_id = EXCLUDED.employee_id
          RETURNING device_id
        `);

        if (presenceRows.length === 0) throw new DeviceOwnershipConflictError();
      }

      return { inserted: saved, saved, duplicateCount };
    });
  },
});
