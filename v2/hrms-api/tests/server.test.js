import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
const uri=process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('startup reports missing Mongo configuration without exposing environment values',{timeout:10000},async()=>{
  const secret='startup-diagnostic-secret-must-not-appear';
  const child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{PATH:process.env.PATH,MONGODB_URI:'',JWT_SECRET:secret},stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',chunk=>{output+=chunk;});child.stderr.on('data',chunk=>{output+=chunk;});
  const [code]=await once(child,'exit');
  assert.equal(code,1);
  assert.match(output,/HRMS v2 startup failed: MONGODB_URI is required\./);
  assert.ok(!output.includes(secret));
});
test('independent server starts, serves real readiness and shuts down on SIGTERM', {skip:!uri,timeout:20000},async t=>{
  assert.match(new URL(uri).pathname,/[_-](test|isolated|ci)([_-]|$)/i);
  const reserve=net.createServer();reserve.listen(0,'127.0.0.1');await once(reserve,'listening');
  const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));
  const child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{PATH:process.env.PATH,MONGODB_URI:uri,JWT_SECRET:randomBytes(32).toString('hex'),HOST:'127.0.0.1',PORT:String(port)},stdio:['ignore','pipe','pipe']});
  t.after(()=>{if(child.exitCode===null)child.kill('SIGKILL');});
  let output='';child.stdout.on('data',chunk=>{output+=chunk;});child.stderr.on('data',chunk=>{output+=chunk;});
  const exited=once(child,'exit');
  for(let attempt=0;attempt<100&&!output.includes('Server listening');attempt++){
    if(child.exitCode!==null)assert.fail(`server exited: ${output}`);
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert.match(output,/Server listening/);
  const response=await fetch(`http://127.0.0.1:${port}/api/v2/ready`);
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'ready'});
  child.kill('SIGTERM');
  const [code,signal]=await exited;assert.equal(code,0);assert.equal(signal,null);
});
