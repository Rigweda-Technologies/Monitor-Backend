import test from 'node:test';
import assert from 'node:assert/strict';
import { createLegacyRouterHarness } from './helpers/legacy-router-harness.js';

test('legacy router harness executes injected V1 route, validation and response builder without starting V1 app',async t=>{
  const department={_id:'department-1',organizationId:'parity-org',name:'Operations',code:'OPS',toObject(){return {...this};}};
  const models={Department:{findOne:async()=>null,create:async()=>department},Employee:{findOne:()=>({select:async()=>null})},AuditLog:{}};
  const app=createLegacyRouterHarness({mounts:[{path:'/api/v1/departments',modulePath:'src/modules/departments/department.routes.js'}],overrides:{
    'src/modules/departments/department.model.js':models.Department,
    'src/modules/employees/employee.model.js':models.Employee,
    'src/modules/auditLogs/auditLogs.model.js':models.AuditLog,
    'src/modules/auditLogs/auditLogs.service.js':{audit:async()=>{}},
    'src/modules/organizations/organization.service.js':{isUserSuperAdmin:async()=>false},
  }});
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/departments`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Operations',code:'OPS'})});
  assert.equal(response.status,201);
  assert.deepEqual(await response.json(),{success:true,code:201,message:'Department created successfully',data:{_id:'department-1',organizationId:'parity-org',name:'Operations',code:'OPS'},error:null});
});
