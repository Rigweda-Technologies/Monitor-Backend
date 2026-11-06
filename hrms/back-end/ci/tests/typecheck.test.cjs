const test = require('node:test');
const assert = require('node:assert/strict');
const { compareDiagnostics } = require('../typecheck.cjs');
test('rejects new diagnostics and additional occurrences', () => {
  assert.deepEqual(compareDiagnostics({ a: 1 }, { a: 1 }), []);
  assert.equal(compareDiagnostics({ a: 2 }, { a: 1 }).length, 1);
  assert.equal(compareDiagnostics({ b: 1 }, { a: 1 }).length, 2);
});
test('fixed debt requires baseline removal so errors cannot silently return', () => {
  assert.equal(compareDiagnostics({}, { a: 1 }).length, 1);
});
test('diagnostic baseline is portable between developer and CI checkout paths', () => {
  const { normalizeMessage } = require('../typecheck.cjs');
  assert.equal(normalizeMessage('import("/work/hrms/src/service")', '/work/hrms'),
    normalizeMessage('import("/home/runner/hrms/src/service")', '/home/runner/hrms'));
});
