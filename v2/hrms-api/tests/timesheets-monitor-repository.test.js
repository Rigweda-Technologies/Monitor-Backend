import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimesheetMonitorRepository } from '../src/modules/timesheets/timesheet-monitor.repository.js';

test('timesheet monitor repository uses bound Prisma parameters and maps monitor identities', async () => {
  let captured;
  const repository = createTimesheetMonitorRepository({ prisma: { $queryRawUnsafe: async (...args) => { captured = args; return [{ employee_id: 'E-7', date_key: '2026-10-31', total_seconds: 3600n, first_seen_at: new Date('2026-10-31T01:00:00Z'), last_seen_at: new Date('2026-10-31T02:00:00Z') }]; } } });
  const result = await repository.getAttendanceHours({ organizationId: 'org-1', start: new Date('2026-10-31T00:00:00Z'), end: new Date('2026-11-01T00:00:00Z'), timeZone: 'Asia/Kolkata', employees: [{ _id: 'employee-7', employeeCode: 'E-7' }] });
  assert.match(captured[0], /monitor_activity_events/);
  assert.match(captured[0], /monitor_app_usage_sessions/);
  assert.deepEqual(captured.slice(1), ['org-1', new Date('2026-10-31T00:00:00Z'), new Date('2026-11-01T00:00:00Z'), 'Asia/Kolkata']);
  assert.deepEqual(result.get('employee-7|2026-10-31'), { employeeId: 'employee-7', dateKey: '2026-10-31', totalMinutes: 60, firstSeenAt: new Date('2026-10-31T01:00:00Z'), lastSeenAt: new Date('2026-10-31T02:00:00Z') });
});
