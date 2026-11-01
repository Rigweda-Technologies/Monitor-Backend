import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { loadConfig } from '../src/config/env.js';
const env = () => ({ MONGODB_URI: 'mongodb://127.0.0.1/hrms_v2_test', JWT_SECRET: randomBytes(32).toString('hex') });
test('configuration requires independent database and signing settings', () => {
  assert.throws(() => loadConfig({}), /MONGODB_URI/);
  assert.throws(() => loadConfig({ MONGODB_URI: env().MONGODB_URI }), /JWT_SECRET/);
  assert.equal(loadConfig(env()).port, 8002);
  assert.throws(() => loadConfig({ ...env(), PORT: 'not-a-port' }), /PORT/);
});
test('PostgreSQL config preserves the monitor aliases, payroll opt-in, pool bounds and SSL mode', () => {
  const monitor = loadConfig({ ...env(), MONITOR_TOOL_DATABASE_URL:'postgresql://monitor:synthetic@localhost:5432/monitor', MONITOR_PG_SSL_MODE:'require' });
  assert.equal(monitor.postgres.monitor.url, 'postgresql://monitor:synthetic@localhost:5432/monitor');
  assert.equal(monitor.postgres.monitor.poolMax, 20);
  assert.equal(monitor.postgres.monitor.sslMode, 'require');
  assert.equal(monitor.postgres.payroll.enabled, false);

  const payroll = loadConfig({ ...env(), PAYROLL_DB_ENABLED:'true', PGHOST:'127.0.0.1', PGDATABASE:'payroll_test', PGUSER:'test-user', PGPASSWORD:'synthetic secret' });
  assert.equal(new URL(payroll.postgres.payroll.url).searchParams.get('password'), null);
  assert.equal(new URL(payroll.postgres.payroll.url).password, 'synthetic%20secret');
  assert.equal(payroll.postgres.payroll.poolMax, 20);
  assert.throws(() => loadConfig({ ...env(), PAYROLL_DB_ENABLED:'true' }), /Postgres config is missing/);
});

test('legacy payroll and job settings are loaded once and injected as runtime config', () => {
  const config=loadConfig({ ...env(), PAYROLL_IDEMPOTENCY_REQUIRED:'true', PAYROLL_COMPUTE_ASYNC_DEFAULT:'true', PAYROLL_DEFAULT_TIMEZONE:'UTC', PAYROLL_DEFAULT_SALARY_PAY_DAY:'29', PAYROLL_OT_MULTIPLIER:'1.5', ENABLE_JOB_SCHEDULER:'true', ENABLE_JOB_WORKER:'true', JOB_QUEUE_NAME:'hrms-test', JOB_WORKER_CONCURRENCY:'3', JOB_CRON_LEAVE_CREDIT:'5 1 * * *', JOB_CRON_ATTENDANCE_AUTO_CHECKOUT:'0 1 * * *', JOB_TIMEZONE:'Asia/Kolkata' });
  assert.deepEqual(config.payroll,{idempotencyRequired:true});
  assert.equal(config.payrollOptions.computeAsyncDefault,true);
  assert.equal(config.payrollOptions.defaultTimezone,'UTC');
  assert.equal(config.payrollOptions.defaultSalaryPayDay,29);
  assert.equal(config.payrollOptions.overtimeMultiplier,1.5);
  assert.equal(config.jobs.schedulerEnabled,true);
  assert.equal(config.jobs.workerEnabled,true);
  assert.equal(config.jobs.jobQueueName,'hrms-test');
  assert.equal(config.jobs.workerConcurrency,3);
  assert.equal(config.jobs.leaveCreditCron,'5 1 * * *');
  assert.equal(config.jobs.attendanceAutoCheckoutCron,'0 1 * * *');
  assert.equal(config.jobs.jobTimezone,'Asia/Kolkata');
});
