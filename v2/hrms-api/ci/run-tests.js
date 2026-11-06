import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const localHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
const requireIsolatedUrl = (key, protocol) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required in CI`);
  const parsed = new URL(value);
  if (!parsed.protocol.startsWith(protocol) || !localHosts.has(parsed.hostname) || !/[_-](test|isolated|ci)([_-]|$)/i.test(parsed.pathname)) {
    throw new Error(`${key} must use a local disposable test/isolated/ci database`);
  }
};
requireIsolatedUrl('V2_HRMS_ISOLATED_TEST_DATABASE_URL', 'mongodb');
requireIsolatedUrl('V2_HRMS_ISOLATED_MONITOR_TEST_DATABASE_URL', 'postgres');
requireIsolatedUrl('V2_HRMS_ISOLATED_PAYROLL_TEST_DATABASE_URL', 'postgres');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Bound hosted-runner resource use and do not let a leaked provider/socket handle
// keep a fully completed suite alive indefinitely. Test failures and timeouts still
// produce a non-zero status and the TAP summary remains the zero-skip authority.
const result = spawnSync(process.execPath, [
  '--test',
  '--test-concurrency=2',
  '--test-timeout=120000',
  '--test-force-exit',
  '--test-reporter=tap'
], { cwd: root, encoding: 'utf8', env: process.env, maxBuffer: 40 * 1024 * 1024, timeout: 20 * 60 * 1000 });
const output = `${result.stdout || ''}${result.stderr || ''}`;
mkdirSync(path.join(root, 'ci/reports'), { recursive: true });
writeFileSync(path.join(root, 'ci/reports/tests.tap'), output);
process.stdout.write(output);
if (result.error) throw result.error;
const skipped = [...output.matchAll(/^# skipped (\d+)$/gm)];
if (result.status !== 0 || skipped.length !== 1 || Number(skipped[0][1]) !== 0) {
  console.error('Required tests failed, were interrupted, or were skipped.');
  process.exitCode = 1;
}
