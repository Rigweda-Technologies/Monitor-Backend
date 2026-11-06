const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
// Exercise the actual registered handler without importing app.js (which starts the server).
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const handlerSource = source.slice(source.indexOf('app.get("/ready"'), source.indexOf('\nif (shouldExposeMetrics)', source.indexOf('app.get("/ready"')));
async function requestReadiness({ redisEnabled = true, redisReady = true, databaseReady = true, payrollReady = true } = {}) {
  let handler;
  let connected = false;
  vm.runInNewContext(handlerSource, {
    app: { get: (_path, callback) => { handler = callback; } },
    mongoose: { connection: { readyState: databaseReady ? 1 : 0 } },
    isRedisEnabled: () => redisEnabled,
    isRedisReady: () => redisReady,
    isPayrollDbEnabled: () => true,
    isPayrollDbReady: () => payrollReady,
    getRedisClient: async () => { connected = true; return { status: 'connecting' }; }
  });
  const result = { code: null, body: null };
  await handler({}, { status(code) { result.code = code; return this; }, json(body) { result.body = body; } });
  return { ...result, connected };
}
test('already-ready Redis allows deployment readiness without reconnecting', async () => {
  const result = await requestReadiness();
  assert.equal(result.code, 200);
  assert.equal(result.connected, false);
});
test('unready enabled dependency blocks readiness', async () => {
  for (const options of [{ redisReady: false }, { databaseReady: false }, { payrollReady: false }]) {
    assert.equal((await requestReadiness(options)).code, 503);
  }
});
test('disabled Redis does not block readiness', async () => {
  assert.equal((await requestReadiness({ redisEnabled: false, redisReady: false })).code, 200);
});
