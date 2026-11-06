const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '../../..');
const hrmsRoot = path.join(repositoryRoot, 'hrms/back-end');
const registryPath = path.join(hrmsRoot, 'src/routes/apiV1.js');
const { API_V1_PREFIX, API_V1_ROUTES } = require(registryPath);

const clean = value => `/${String(value || '').split('/').filter(Boolean).join('/')}`;
const expand = value => Array.isArray(value) ? value.flatMap(expand) : [value];
const collectRoutes = router => {
  const routes = [];
  for (const layer of router.stack || []) {
    if (layer.route) {
      for (const routePath of expand(layer.route.path)) {
        for (const method of Object.keys(layer.route.methods || {}).filter(name => layer.route.methods[name])) {
          routes.push({ method:method.toUpperCase(), path:clean(routePath) });
        }
      }
    } else if (layer.handle?.stack) {
      // Current nested HRMS routers mount at `/`; express.Router does not expose
      // its mount path in Express 5, so non-root nested mounts require an
      // explicit entry in this exporter before regeneration.
      routes.push(...collectRoutes(layer.handle));
    }
  }
  return routes;
};

const endpoints = [];
for (const [mount, modulePath] of API_V1_ROUTES) {
  const file = path.resolve(path.dirname(registryPath), `${modulePath}.js`);
  const router = require(file);
  for (const route of collectRoutes(router)) {
    const v1Path = clean(`${API_V1_PREFIX}${mount}${route.path}`);
    endpoints.push({ method:route.method, v1Path, v2Path:clean(`/api/v2${v1Path.slice('/api/v1'.length)}`), source:path.relative(repositoryRoot,file) });
  }
}

endpoints.push(
  { method:'POST', v1Path:'/api/v1/notifications/device-token/register', v2Path:'/api/v2/notifications/device-token/register', source:'hrms/back-end/src/integrations/fcm/index.js' },
  { method:'POST', v1Path:'/api/v1/notifications/device-token/unregister', v2Path:'/api/v2/notifications/device-token/unregister', source:'hrms/back-end/src/integrations/fcm/index.js' },
);

const manifestPath = path.join(__dirname, '../tests/fixtures/v1-api-route-manifest.json');
fs.mkdirSync(path.dirname(manifestPath), { recursive:true });
fs.writeFileSync(manifestPath, `${JSON.stringify({ generatedFrom:'hrms/back-end/src/routes/apiV1.js', registeredRouteCount:endpoints.length, endpoints }, null, 2)}\n`);
console.log(`Wrote ${endpoints.length} V1 route registrations to ${path.relative(repositoryRoot,manifestPath)}`);
