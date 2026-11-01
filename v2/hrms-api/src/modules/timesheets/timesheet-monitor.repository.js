// This repository only reads the shared monitor schema. SQL text is static and all
// values are bound through Prisma's parameterized raw-query API.
export const createTimesheetMonitorRepository = ({ prisma } = {}) => {
  if (!prisma?.$queryRawUnsafe) throw new TypeError('Prisma monitor client is required');
  return {
    async getAttendanceHours({ organizationId, start, end, timeZone, employees = [] }) {
      const employeeMap = new Map();
      for (const employee of employees) {
        const id = String(employee._id);
        employeeMap.set(id, id);
        if (employee.employeeCode) employeeMap.set(String(employee.employeeCode), id);
        if (employee.userId) employeeMap.set(String(employee.userId), id);
      }
      const rows = await prisma.$queryRawUnsafe(`WITH activity_daily AS (
        SELECT employee_id,
          to_char((observed_at AT TIME ZONE $4)::date, 'YYYY-MM-DD') AS date_key,
          COALESCE(SUM(active_seconds + idle_seconds), 0)::bigint AS total_seconds,
          MAX(observed_at) AS last_observed_at
        FROM monitor_activity_events
        WHERE organization_id = $1 AND observed_at >= $2 AND observed_at <= $3
        GROUP BY employee_id, (observed_at AT TIME ZONE $4)::date
      ), session_daily AS (
        SELECT employee_id,
          to_char((started_at AT TIME ZONE $4)::date, 'YYYY-MM-DD') AS date_key,
          MIN(started_at) AS first_seen_at,
          MAX(ended_at) AS last_seen_at
        FROM monitor_app_usage_sessions
        WHERE organization_id = $1 AND started_at <= $3 AND ended_at >= $2
        GROUP BY employee_id, (started_at AT TIME ZONE $4)::date
      )
      SELECT COALESCE(activity_daily.employee_id, session_daily.employee_id) AS employee_id,
        COALESCE(activity_daily.date_key, session_daily.date_key) AS date_key,
        COALESCE(activity_daily.total_seconds, 0)::bigint AS total_seconds,
        CASE
          WHEN session_daily.first_seen_at IS NOT NULL AND session_daily.last_seen_at IS NOT NULL
            AND session_daily.first_seen_at < session_daily.last_seen_at THEN session_daily.first_seen_at
          WHEN activity_daily.last_observed_at IS NOT NULL AND COALESCE(activity_daily.total_seconds, 0) > 0
            THEN activity_daily.last_observed_at - (COALESCE(activity_daily.total_seconds, 0)::text || ' seconds')::interval
          ELSE session_daily.first_seen_at
        END AS first_seen_at,
        COALESCE(session_daily.last_seen_at, activity_daily.last_observed_at) AS last_seen_at
      FROM activity_daily
      FULL OUTER JOIN session_daily
        ON activity_daily.employee_id = session_daily.employee_id
        AND activity_daily.date_key = session_daily.date_key`, String(organizationId), start, end, timeZone);
      return new Map(rows.map(row => {
        const sourceEmployeeId = String(row.employee_id);
        const employeeId = employeeMap.get(sourceEmployeeId) || sourceEmployeeId;
        const dateKey = String(row.date_key);
        return [`${employeeId}|${dateKey}`, {
          employeeId,
          dateKey,
          totalMinutes: Math.max(0, Math.round(Number(row.total_seconds || 0) / 60)),
          firstSeenAt: row.first_seen_at,
          lastSeenAt: row.last_seen_at,
        }];
      }));
    },
  };
};
