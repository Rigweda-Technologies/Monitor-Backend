import { Prisma } from "@prisma/client";
import { DeviceOwnershipConflictError } from "../../errors.js";
import { lockAndAssertDeviceOwners } from "../device-ownership/device-ownership.repository.js";

export const createAppUsageRepository = ({ prisma }) => ({
  async saveSessions({ organizationId, employeeId, employeeName, events }) {
    return prisma.$transaction(async (transaction) => {
      await lockAndAssertDeviceOwners({
        transaction,
        deviceIds: events.map((event) => event.deviceId),
        organizationId,
        employeeId,
      });

      for (const sessionId of [...new Set(events.map((event) => event.sessionId))].sort()) {
        await transaction.$queryRaw(Prisma.sql`
          SELECT pg_advisory_xact_lock(hashtext(${`app-usage:${sessionId}`})::bigint)::text
        `);
      }

      for (const event of events) {
        const conflictingSession = await transaction.$queryRaw(Prisma.sql`
          SELECT 1 AS session_conflict
          FROM monitor_app_usage_sessions
          WHERE session_id = ${event.sessionId}
            AND (
              device_id <> ${event.deviceId}
              OR employee_id <> ${employeeId}
              OR (organization_id IS NOT NULL AND organization_id <> ${organizationId})
            )
          LIMIT 1
        `);
        if (conflictingSession.length > 0) throw new DeviceOwnershipConflictError();

        const rows = await transaction.$queryRaw(Prisma.sql`
          INSERT INTO monitor_app_usage_sessions (
            session_id, organization_id, employee_id, employee_name, device_id, observed_at,
            app_name, process_name, started_at, ended_at, active_seconds, key_press_count,
            key_names, typed_text, key_stream_text, upload_status, uploaded_at
          ) VALUES (
            ${event.sessionId}, ${organizationId}, ${employeeId}, ${employeeName}, ${event.deviceId}, ${event.observedAt},
            ${event.appName}, ${event.processName}, ${event.startedAt}, ${event.endedAt}, ${event.activeSeconds}, ${event.keyPressCount},
            ${JSON.stringify(event.keyNames)}::jsonb, ${event.typedText}, ${event.keyStreamText}, 'uploaded', NOW()
          )
          ON CONFLICT (device_id, session_id) DO UPDATE SET
            employee_name = COALESCE(EXCLUDED.employee_name, monitor_app_usage_sessions.employee_name),
            observed_at = EXCLUDED.observed_at,
            app_name = EXCLUDED.app_name,
            process_name = EXCLUDED.process_name,
            started_at = EXCLUDED.started_at,
            ended_at = EXCLUDED.ended_at,
            active_seconds = EXCLUDED.active_seconds,
            key_press_count = EXCLUDED.key_press_count,
            key_names = EXCLUDED.key_names,
            typed_text = EXCLUDED.typed_text,
            key_stream_text = EXCLUDED.key_stream_text,
            upload_status = 'uploaded',
            last_error = NULL,
            uploaded_at = NOW()
          WHERE monitor_app_usage_sessions.organization_id IS NOT DISTINCT FROM EXCLUDED.organization_id
            AND monitor_app_usage_sessions.employee_id = EXCLUDED.employee_id
          RETURNING session_id
        `);
        if (rows.length === 0) throw new DeviceOwnershipConflictError();
      }

      return { received: events.length, employeeId, organizationId };
    });
  },
});
