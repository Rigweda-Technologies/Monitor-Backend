import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoleSeedCommand } from '../src/modules/roles/role-seed-command.js';

const fixture=()=>{
  const calls=[];
  const organizations=[{_id:'507f1f77bcf86cd799439011',code:'ACME'},{_id:'507f1f77bcf86cd799439012',code:'OTHER'}];
  const Organization={find:filter=>({select:async()=>organizations.filter(org=>(!filter._id||String(org._id)===filter._id)&&org.code!=='SYSTEM')})};
  return {calls,run:createRoleSeedCommand({Organization,seedOrganizationRoles:async id=>calls.push(String(id))})};
};

test('role seed command defaults to read-only dry run and excludes SYSTEM',async()=>{
  const {calls,run}=fixture();
  assert.deepEqual(await run(),{dryRun:true,matched:2,seeded:0});
  assert.deepEqual(calls,[]);
});

test('role seed command applies only to non-SYSTEM organizations and supports a target',async()=>{
  const {calls,run}=fixture();
  assert.deepEqual(await run({apply:true}),{dryRun:false,matched:2,seeded:2});
  assert.deepEqual(calls,['507f1f77bcf86cd799439011','507f1f77bcf86cd799439012']);
  calls.length=0;
  assert.deepEqual(await run({apply:true,organizationId:'507f1f77bcf86cd799439012'}),{dryRun:false,matched:1,seeded:1});
  assert.deepEqual(calls,['507f1f77bcf86cd799439012']);
});

test('role seed command rejects malformed organization IDs before querying',async()=>{
  const {run}=fixture();
  await assert.rejects(run({organizationId:'SYSTEM'}),/valid MongoDB ObjectId/);
});
