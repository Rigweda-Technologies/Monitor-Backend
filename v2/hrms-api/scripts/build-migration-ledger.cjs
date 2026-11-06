const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'tests/fixtures/v1-api-route-manifest.json');
const outputPath = path.join(root, 'tests/fixtures/v1-api-migration-ledger.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const routeFiles = fs.readdirSync(path.join(root, 'src/modules'), { recursive: true })
  .filter(file => file.endsWith('.routes.js') || file.endsWith('-routes.js'))
  .map(file => `src/modules/${file}`);
const testFiles = fs.readdirSync(path.join(root, 'tests'))
  .filter(file => file.endsWith('.test.js'))
  .map(file => `tests/${file}`);
const filesWithText = files => files.map(file => ({ file, text: fs.readFileSync(path.join(root, file), 'utf8') }));
const routeSources = filesWithText(routeFiles);
const testSources = filesWithText(testFiles);
const unique = new Map();
const moduleNames = {
  users: 'auth',
  'user-administration': 'user-administration',
  'monitor': 'monitor-updates',
  'week-offs': 'week-offs',
};
const moduleForPath = endpoint => {
  const first = endpoint.v1Path.split('/')[3];
  if (first === 'users' && ['/api/v1/users', '/api/v1/users/org-user'].includes(endpoint.v1Path)) return 'user-administration';
  return moduleNames[first] || first;
};
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const routePattern = value => new RegExp(escapeRegex(value).replace(/:[A-Za-z0-9_]+/g, '[^/?`]+'));

for (const endpoint of manifest.endpoints) {
  const key = `${endpoint.method} ${endpoint.v1Path}`;
  if (!unique.has(key)) unique.set(key, endpoint);
}

const operations = [...unique.values()].map(endpoint => {
  const expectedModule = moduleForPath(endpoint);
  const route = routeSources.find(source => source.file.startsWith(`src/modules/${expectedModule}/`));
  if (!route) throw new Error(`No V2 route file for ${endpoint.v2Path} in module ${expectedModule}`);
  const relativePath = endpoint.v2Path.replace(/^\/api\/v2\/[^/]+/, '') || '/';
  const searchableSuffix = relativePath.replace(/^\//, '');
  const v1RelativePath = endpoint.v1Path.replace(/^\/api\/v1\/[^/]+/, '') || '/';
  const matchingParityTest = source => {
    if (!/parity|contract/i.test(source.file)) return false;
    const normalized = source.text.replace(/\$\{idPath\}/g, '/parameter').replace(/\$\{[^}]+\}/g, 'parameter');
    return normalized.includes(endpoint.v1Path) || routePattern(v1RelativePath).test(normalized) || (searchableSuffix.length > 1 && normalized.includes(searchableSuffix)) || (searchableSuffix && source.file === 'tests/leaves-activity-contract-parity.test.js' && endpoint.v1Path.startsWith('/api/v1/activity/'));
  };
  const parityPathTests = testSources.filter(matchingParityTest);
  const evidenceTests = testSources.filter(source => parityPathTests.includes(source) || source.text.includes(endpoint.v2Path)).map(source => source.file);
  // Explicit suites are often table-driven or mount routes at runtime, so static
  // path matching misses them. Keep this map curated and label it only as a
  // direct-parity test reference; the suite itself remains the behavioral proof.
  const directParitySuites = {
    auth: ['tests/parity.test.js'],
    'user-administration': ['tests/v1-v2-organizations-users-dashboard-parity.test.js', 'tests/organization-admin-assignment-parity.test.js'],
    organizations: ['tests/v1-v2-organizations-users-dashboard-parity.test.js', 'tests/v1-v2-organization-lifecycle-parity.integration.test.js', 'tests/organization-admin-assignment-parity.test.js', 'tests/organization-hard-delete-parity.test.js'],
    roles: ['tests/v1-v2-roles-permissions-parity.test.js'],
    permissions: ['tests/v1-v2-roles-permissions-parity.test.js'],
    payroll: ['tests/payroll-lifecycle-parity.integration.test.js'],
    timesheets: ['tests/timesheets-contract-parity.test.js', 'tests/timesheets-mutation-contract-parity.test.js'],
    leaves: ['tests/leaves-activity-contract-parity.test.js'],
    activity: ['tests/leaves-activity-contract-parity.test.js'],
    'org-settings': ['tests/v1-v2-org-settings-documents-notifications-parity.test.js'],
    'organization-documents': ['tests/v1-v2-org-settings-documents-notifications-parity.test.js'],
    notifications: ['tests/v1-v2-org-settings-documents-notifications-parity.test.js'],
    agents: ['tests/agent-monitor-postgres.integration.test.js'],
    'monitor-updates': ['tests/agent-monitor-update-parity.test.js'],
    'leave-types': ['tests/supporting-domains-contract-parity.test.js', 'tests/supporting-domains-write-parity.test.js'],
    holidays: ['tests/supporting-domains-contract-parity.test.js', 'tests/supporting-domains-write-parity.test.js'],
    'week-offs': ['tests/supporting-domains-contract-parity.test.js', 'tests/supporting-domains-write-parity.test.js'],
    shifts: ['tests/supporting-domains-contract-parity.test.js', 'tests/supporting-domains-write-parity.test.js'],
    'approval-flows': ['tests/supporting-domains-contract-parity.test.js', 'tests/supporting-domains-write-parity.test.js'],
    'leave-balances': ['tests/supporting-domains-contract-parity.test.js', 'tests/supporting-domains-write-parity.test.js'],
    dashboard: ['tests/v1-v2-organizations-users-dashboard-parity.test.js'],
    employees: ['tests/v1-v2-employee-designation-department-crud-parity.test.js'],
    departments: ['tests/v1-v2-employee-designation-department-crud-parity.test.js'],
    designations: ['tests/v1-v2-employee-designation-department-crud-parity.test.js'],
    expenses: ['tests/business-services-parity.integration.test.js'],
    projects: ['tests/business-services-parity.integration.test.js'],
    hiring: ['tests/business-services-parity.integration.test.js'],
  };
  for (const file of directParitySuites[expectedModule] || []) {
    if (testFiles.includes(file) && !evidenceTests.includes(file)) evidenceTests.push(file);
  }
  if (!evidenceTests.length) {
    const moduleTest = testFiles.find(file => file.startsWith(`tests/${path.basename(path.dirname(route.file))}-`));
    if (moduleTest) evidenceTests.push(moduleTest);
  }
  const evidence = evidenceTests.some(file => (directParitySuites[expectedModule] || []).includes(file)) ? 'parity-suite-reference' : parityPathTests.length ? 'path-reference' : evidenceTests.length ? 'test-reference' : 'route-only';
  return {
    method: endpoint.method,
    v1Path: endpoint.v1Path,
    v2Path: endpoint.v2Path,
    v1Source: endpoint.source,
    v2RouteFile: route.file,
    testFiles: evidenceTests,
    evidence,
    evidenceScope: evidence === 'parity-suite-reference'
      ? 'Curated reference to a V1/V2 parity suite for this module; inspect that suite to determine which behaviors actually execute.'
      : 'Test file references a route path or module; this ledger does not establish that a behavioral assertion executed.',
  };
});

fs.writeFileSync(outputPath, `${JSON.stringify({ generatedFrom: 'tests/fixtures/v1-api-route-manifest.json', operationCount: operations.length, operations }, null, 2)}\n`);
console.log(`Wrote ${operations.length} unique operations to ${path.relative(root, outputPath)}`);
