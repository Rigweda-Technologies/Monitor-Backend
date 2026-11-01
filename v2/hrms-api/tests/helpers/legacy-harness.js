// Test-only loader. It executes the real v1 router/controller/service without app.js,
// env files, bootstrap, scheduler, mail, or external biometric providers.
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const legacyRoot = fileURLToPath(new URL('../../../../hrms/back-end/', import.meta.url));
export const createLegacyHarness = ({ models, config, sendMail, faceFetch }) => {
  const nativeRequire = createRequire(path.join(legacyRoot, 'package.json'));
  const express = nativeRequire('express');
  const overrides = {
    'src/modules/users/user.model.js': models.User,
    'src/modules/organizations/org-user.model.js': models.Membership,
    'src/modules/organizations/organization.model.js': models.Organization,
    'src/modules/roles/role.model.js': models.Role,
    'src/modules/permissions/permission.model.js': models.Permission,
    'src/modules/employees/employee.model.js': models.Employee,
    'src/modules/orgSettings/orgSettings.model.js': models.Settings,
    'src/modules/leaveBalances/leaveBalance.service.js': {},
    'src/utils/sendMail.js': sendMail,
    'src/middlewares/rateLimiter.js': { publicLimiter: (_req,_res,next) => next() },
  };
  const cache = new Map();
  const load = filename => {
    if (Object.hasOwn(overrides, filename)) return overrides[filename];
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const localRequire = spec => {
      if (!spec.startsWith('.')) return nativeRequire(spec);
      const target = path.normalize(path.join(path.dirname(filename), spec));
      return load(target.endsWith('.js') ? target : `${target}.js`);
    };
    const execute = vm.runInThisContext(`(function(require,module,exports,process,console,fetch){${fs.readFileSync(path.join(legacyRoot, filename), 'utf8')}\n})`, { filename });
    execute(localRequire, module, module.exports, { env: { JWT_SECRET: config.jwtSecret, JWT_EXPIRES_IN: '1d', BCRYPT_SALT_ROUNDS: '4', FACEPP_API_KEY: 'synthetic', FACEPP_API_SECRET: 'synthetic' } }, { log() {}, error() {} }, faceFetch);
    return module.exports;
  };
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use('/api/v1/users', load('src/modules/users/user.routes.js'));
  app.use(load('src/middlewares/error.middleware.js'));
  return app;
};
