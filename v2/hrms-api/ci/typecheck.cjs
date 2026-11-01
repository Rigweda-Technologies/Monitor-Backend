const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const normalizeMessage = (message, root) => message.split(path.sep).join('/').replaceAll(root.split(path.sep).join('/'), '<project>');
const compareDiagnostics = (current, baseline) => {
  const differences = [];
  for (const key of new Set([...Object.keys(current), ...Object.keys(baseline)])) {
    if ((current[key] || 0) !== (baseline[key] || 0)) differences.push(`${key}: expected ${baseline[key] || 0}, found ${current[key] || 0}`);
  }
  return differences;
};
const main = () => {
  const root = path.resolve(__dirname, '..');
  process.chdir(root);
  const config = ts.readConfigFile(path.join(root, 'tsconfig.check.json'), ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  if (parsed.errors.length || !parsed.fileNames.length) throw new Error('Invalid or empty typecheck configuration');
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram(parsed.fileNames, parsed.options));
  const counts = {};
  for (const diagnostic of diagnostics) {
    if (!diagnostic.file) throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    const file = path.relative(root, diagnostic.file.fileName).split(path.sep).join('/');
    const message = normalizeMessage(ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '), root);
    const key = `${file} TS${diagnostic.code}: ${message}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b, 'en')));
  const baselinePath = path.join(__dirname, 'typecheck-baseline.json');
  if (process.argv.includes('--write-baseline')) {
    fs.writeFileSync(baselinePath, `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`Recorded ${diagnostics.length} existing diagnostics. Review baseline changes; CI never regenerates it.`);
    return;
  }
  const differences = compareDiagnostics(sorted, JSON.parse(fs.readFileSync(baselinePath, 'utf8')));
  if (differences.length) {
    console.error(differences.join('\n'));
    console.error('Typecheck failed: fix new diagnostics; remove resolved diagnostics from the baseline.');
    process.exitCode = 1;
  } else console.log(`Typecheck: ${parsed.fileNames.length} source files; ${diagnostics.length} known diagnostics, no changes.`);
};
if (require.main === module) main();
module.exports = { compareDiagnostics, normalizeMessage };
