const test = require('node:test');
const assert = require('node:assert/strict');
const { compareDiagnostics, normalizeMessage } = require('../typecheck.cjs');
test('typecheck baseline rejects new, removed, or repeated diagnostics', () => {
  assert.deepEqual(compareDiagnostics({ a: 1 }, { a: 1 }), []);
  assert.equal(compareDiagnostics({ a: 2 }, { a: 1 }).length, 1);
  assert.equal(compareDiagnostics({}, { a: 1 }).length, 1);
});
test('diagnostic messages are checkout-path independent', () => {
  assert.equal(normalizeMessage('import("/work/hrms-v2/src/service")', '/work/hrms-v2'), normalizeMessage('import("/runner/hrms-v2/src/service")', '/runner/hrms-v2'));
});
