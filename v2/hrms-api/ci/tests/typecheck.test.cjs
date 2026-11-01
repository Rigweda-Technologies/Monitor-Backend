const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { compareDiagnostics, normalizeMessage } = require('../typecheck.cjs');
test('typecheck baseline rejects new, removed, or repeated diagnostics', () => {
  assert.deepEqual(compareDiagnostics({ a: 1 }, { a: 1 }), []);
  assert.equal(compareDiagnostics({ a: 2 }, { a: 1 }).length, 1);
  assert.equal(compareDiagnostics({}, { a: 1 }).length, 1);
});
test('diagnostic messages are checkout-path independent', () => {
  assert.equal(normalizeMessage('import("/work/hrms-v2/src/service")', '/work/hrms-v2'), normalizeMessage('import("/runner/hrms-v2/src/service")', '/runner/hrms-v2'));
});
test('source and tests do not embed a developer checkout path', () => {
  const root = path.resolve(__dirname, '../..');
  const files = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (/\.(?:js|cjs|json)$/.test(entry.name)) files.push(target);
    }
  };
  for (const directory of ['src', 'scripts', 'tests', 'ci']) visit(path.join(root, directory));
  const offenders = files.filter(file => /\/(?:Users|home)\/[^/]+\/(?:Desktop|workspace|work)\//.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(offenders.map(file => path.relative(root, file)), []);
});
