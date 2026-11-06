const asRows = value => Array.isArray(value) ? value : [];
const buildFilters = ({appName='',processName='',employeeIds=null,browser='',startIndex=4}) => {
  const args=[],conditions=[];
  const add=(value,sql)=>{args.push(value);conditions.push(sql.replace('?',`$${startIndex+args.length-1}`));};
  if(appName)add(appName,'AND app_name = ?');
  if(processName)add(processName,'AND process_name = ?');
  if(employeeIds?.length)add(employeeIds,'AND employee_id = ANY(?::text[])');
  if(browser)add(`%${browser.toLowerCase()}%`,'AND LOWER(browser) LIKE ?');
  return {args,sql:conditions.length?`\n        ${conditions.join('\n        ')}`:''};
};

export const createMonitorActivityRepository = ({prisma}) => {
  if(!prisma?.$queryRawUnsafe)throw new TypeError('A Prisma monitor client is required');
  return {
    async listLaptopHealthRows({organizationId}){
      return asRows(await prisma.$queryRawUnsafe(`WITH ranked_health AS (SELECT monitor_device_health.*,ROW_NUMBER() OVER (PARTITION BY COALESCE(NULLIF(employee_id,''),NULLIF(employee_code,''),NULLIF(device_id,'')) ORDER BY last_seen_at DESC,updated_at DESC,id DESC) AS snapshot_rank FROM monitor_device_health WHERE ($1::text IS NULL OR organization_id=$1)) SELECT id,organization_id AS "organizationId",employee_id AS "employeeId",employee_name AS "employeeName",employee_code AS "employeeCode",device_id AS "deviceId",hostname,platform,platform_version AS "platformVersion",agent_version AS "agentVersion",cpu_model AS "cpuModel",cpu_core_count AS "cpuCoreCount",cpu_percent AS "cpuPercent",memory_total_bytes AS "memoryTotalBytes",memory_used_bytes AS "memoryUsedBytes",memory_percent AS "memoryPercent",disks,temperature_c AS "temperatureC",battery_percent AS "batteryPercent",battery_charging AS "batteryCharging",uptime_seconds AS "uptimeSeconds",to_char(last_seen_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "lastSeenAt",to_char(reported_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "reportedAt",to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "createdAt",to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "updatedAt" FROM ranked_health WHERE snapshot_rank=1 ORDER BY last_seen_at DESC,updated_at DESC,id DESC`,organizationId||null));
    },
    async listEmployeeActivityRows({organizationId,dayStart,dayEnd}){
      const [activityRows,sessionRows]=await Promise.all([
        prisma.$queryRawUnsafe(`SELECT employee_id AS "employeeId", employee_name AS "employeeName", status, activity_date AS "activityDate", observed_at AS "observedAt", active_seconds AS "activeSeconds", idle_seconds AS "idleSeconds" FROM monitor_activity_events WHERE organization_id = $1 AND observed_at >= $2 AND observed_at <= $3 ORDER BY observed_at ASC`,organizationId,dayStart,dayEnd),
        prisma.$queryRawUnsafe(`SELECT employee_id AS "employeeId", employee_name AS "employeeName", started_at AS "startedAt", ended_at AS "endedAt", active_seconds AS "activeSeconds" FROM monitor_app_usage_sessions WHERE organization_id = $1 AND started_at <= $3 AND ended_at >= $2 ORDER BY started_at ASC, ended_at ASC`,organizationId,dayStart,dayEnd),
      ]);
      return {activityRows:asRows(activityRows),sessionRows:asRows(sessionRows)};
    },
    async listAppUsageRows({organizationId,dayStart,dayEnd,limit,offset,appName,processName,employeeIds}){
      const {args,sql}=buildFilters({appName,processName,employeeIds});
      const base=[organizationId,dayStart,dayEnd,...args];
      const [appRows,countRows,sessionRows]=await Promise.all([
        prisma.$queryRawUnsafe(`SELECT employee_id AS "employeeId", employee_name AS "employeeName", LOWER(app_name) AS "appNameKey", MIN(app_name) AS "appName", LOWER(process_name) AS "processNameKey", MIN(process_name) AS "processName", COALESCE(SUM(active_seconds),0)::integer AS "totalSeconds", COALESCE(SUM(key_press_count),0)::integer AS "keyPressCount", COUNT(*)::integer AS "sessionCount" FROM monitor_app_usage_sessions WHERE organization_id = $1 AND started_at >= $2 AND started_at <= $3${sql} GROUP BY employee_id,employee_name,LOWER(app_name),LOWER(process_name) ORDER BY COALESCE(SUM(active_seconds),0) DESC,MAX(started_at) DESC,LOWER(app_name) ASC,LOWER(process_name) ASC`,...base),
        prisma.$queryRawUnsafe(`SELECT COUNT(*)::integer AS total FROM monitor_app_usage_sessions WHERE organization_id = $1 AND started_at >= $2 AND started_at <= $3${sql}`,...base),
        prisma.$queryRawUnsafe(`SELECT session_id AS "sessionId",employee_id AS "employeeId",device_id AS "deviceId",app_name AS "appName",process_name AS "processName",observed_at AS "observedAt",started_at AS "startedAt",ended_at AS "endedAt",active_seconds AS "activeSeconds",COALESCE(key_press_count,0) AS "keyPressCount",COALESCE(key_names,'[]'::jsonb) AS "keyNames",COALESCE(typed_text,'') AS "typedText",COALESCE(key_stream_text,'') AS "keyStreamText" FROM monitor_app_usage_sessions WHERE organization_id = $1 AND started_at >= $2 AND started_at <= $3${sql} ORDER BY started_at DESC,session_id DESC LIMIT $${base.length+1} OFFSET $${base.length+2}`,...base,limit,offset),
      ]);
      return {appRows:asRows(appRows),countRows:asRows(countRows),sessionRows:asRows(sessionRows)};
    },
    async listAppKeyUsageRows({organizationId,dayStart,dayEnd}){
      const rows=await prisma.$queryRawUnsafe(`SELECT employee_id AS "employeeId",employee_name AS "employeeName",app_name AS "appName",process_name AS "processName",active_seconds AS "activeSeconds",key_press_count AS "keyPressCount",COALESCE(key_names,'[]'::jsonb) AS "keyNames",COALESCE(typed_text,'') AS "typedText",COALESCE(key_stream_text,'') AS "keyStreamText" FROM monitor_app_usage_sessions WHERE organization_id = $1 AND started_at >= $2 AND started_at <= $3 ORDER BY started_at DESC`,organizationId,dayStart,dayEnd);
      return asRows(rows);
    },
    async listBrowserHistoryRows({organizationId,dayStart,dayEnd,limit,offset,employeeIds,browser}){
      const {args,sql}=buildFilters({employeeIds,browser,startIndex:4});
      const base=[organizationId,dayStart,dayEnd,...args];
      const [countRows,rows]=await Promise.all([
        prisma.$queryRawUnsafe(`SELECT COUNT(*)::integer AS total FROM monitor_browser_history WHERE organization_id = $1 AND observed_at >= $2 AND observed_at <= $3${sql}`,...base),
        prisma.$queryRawUnsafe(`SELECT entry_id AS "entryId",employee_id AS "employeeId",employee_name AS "employeeName",device_id AS "deviceId",observed_at AS "observedAt",browser,url,title,active_window_title AS "activeWindowTitle",duration_ms AS "durationMs" FROM monitor_browser_history WHERE organization_id = $1 AND observed_at >= $2 AND observed_at <= $3${sql} ORDER BY observed_at DESC,entry_id DESC LIMIT $${base.length+1} OFFSET $${base.length+2}`,...base,limit,offset),
      ]);
      return {countRows:asRows(countRows),rows:asRows(rows)};
    },
  };
};
