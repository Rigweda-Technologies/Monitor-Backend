const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
// Refuse a missing/remote integration target rather than silently skipping DB coverage.
const target = new URL(process.env.MONITOR_OWNERSHIP_TEST_URL || 'postgresql://invalid/');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || target.pathname !== '/hrms_ci') {
  throw new Error('CI tests require a local disposable PostgreSQL database named hrms_ci');
}
const suite = process.argv[2] || 'hrms';
if (!['hrms', 'desktop'].includes(suite)) throw new Error('Unknown test suite');
const workingDirectory = suite === 'hrms' ? path.resolve(__dirname, '..') : path.resolve(__dirname, '../../../desktop/backend');
const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], {
  cwd: workingDirectory, encoding: 'utf8', env: process.env, maxBuffer: 20 * 1024 * 1024
});
const output = (result.stdout || '') + (result.stderr || '');
fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'reports', `${suite}-tests.tap`), output);
process.stdout.write(output);
if (result.error) throw result.error;
const skips = [...output.matchAll(/^# skipped (\d+)$/gm)];
if (result.status !== 0 || skips.length !== 1 || Number(skips[0][1]) !== 0) {
  console.error('Required tests failed, were interrupted, or were skipped.');
  process.exitCode = 1;
}
