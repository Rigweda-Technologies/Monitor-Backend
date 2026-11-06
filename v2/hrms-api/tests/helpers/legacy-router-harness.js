import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const legacyRoot=fileURLToPath(new URL('../../../../hrms/back-end/',import.meta.url));

/** Test-only loader for the real Express router/controller/service with injected models. */
export const createLegacyRouterHarness=({mounts,overrides={},environment={},identity={userId:'parity-user',_id:'parity-user',organizationId:'parity-org'},sendMail=async()=>true,faceFetch=async()=>({json:async()=>({})})}={})=>{
  if(!Array.isArray(mounts)||!mounts.length)throw new TypeError('At least one legacy router mount is required.');
  const nativeRequire=createRequire(path.join(legacyRoot,'package.json'));
  const injected={
    'src/middlewares/auth.middleware.js':(req,_res,next)=>{req.user={...identity};next();},
    'src/middlewares/authorize.middleware.js':()=> (_req,_res,next)=>next(),
    'src/middlewares/rateLimiter.js':{publicLimiter:(_req,_res,next)=>next()},
    'src/utils/cache.js':{buildRequestCacheKey:()=>'',withCache:async({producer})=>producer(),invalidateCacheNamespace:async()=>false},
    'src/utils/sendMail.js':sendMail,
    ...overrides,
  };
  const cache=new Map();
  const load=filename=>{
    if(Object.hasOwn(injected,filename))return injected[filename];
    if(cache.has(filename))return cache.get(filename).exports;
    const module={exports:{}};cache.set(filename,module);
    const localRequire=spec=>{
      if(!spec.startsWith('.'))return nativeRequire(spec);
      const target=path.normalize(path.join(path.dirname(filename),spec));
      return load(target.endsWith('.js')?target:`${target}.js`);
    };
    const source=fs.readFileSync(path.join(legacyRoot,filename),'utf8');
    const execute=vm.runInThisContext(`(function(require,module,exports,process,console,fetch){${source}\n})`,{filename});
    execute(localRequire,module,module.exports,{env:{...environment}},{log(){},warn(){},error(){}},faceFetch);
    return module.exports;
  };
  const express=nativeRequire('express'),app=express();
  app.use(express.json({limit:'25mb'}));
  app.use(express.urlencoded({extended:true,limit:'25mb'}));
  for(const {path:mount,modulePath} of mounts){
    if(!mount?.startsWith('/api/v1/'))throw new Error(`Legacy parity mount must use /api/v1: ${mount}`);
    app.use(mount,load(modulePath));
  }
  app.use(load('src/middlewares/error.middleware.js'));
  return app;
};
