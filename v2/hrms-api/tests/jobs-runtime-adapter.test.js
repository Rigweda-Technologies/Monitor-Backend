import test from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, getRepeatableJobs, createJobProcessor, createJobScheduler, createJobWorker } from '../src/jobs/runtime.js';

test('v2 repeat jobs preserve v1 names and default cron schedules without reading process env',()=>{
  assert.deepEqual(getRepeatableJobs({}),[
    {name:'leave-credit-daily',cron:'0 0 * * *'},
    {name:'leave-carry-forward-daily',cron:'0 0 * * *'},
    {name:'probation-completion-daily',cron:'0 0 * * *'},
    {name:'organization-document-expiry-daily',cron:'30 8 * * *'},
    {name:'attendance-auto-checkout',cron:'59 23 * * *'},
  ]);
  assert.equal(JOBS.PAYROLL_RUN_COMPUTE,'payroll-run-compute');
  assert.equal(getRepeatableJobs({JOB_CRON_LEAVE_CREDIT:'5 1 * * *'})[0].cron,'5 1 * * *');
  assert.deepEqual(getRepeatableJobs({JOB_CRON_ATTENDANCE_AUTO_CHECKOUT:'0 1 * * *',jobTimezone:'Asia/Kolkata'}).at(-1),{name:'attendance-auto-checkout',cron:'0 1 * * *',timezone:'Asia/Kolkata'});
});

test('scheduler does not register jobs unless explicitly enabled and closes only owned queue',async()=>{
  const added=[],queue={add:async(...args)=>added.push(args),close:async()=>added.push(['close'])};
  const disabled=createJobScheduler({queue});
  assert.deepEqual(await disabled.start(),{started:false,reason:'disabled'});
  assert.deepEqual(added,[]);
  const enabled=createJobScheduler({queue,enabled:true,ownsQueue:true,config:{leaveCreditCron:'1 2 * * *'}});
  assert.deepEqual(await enabled.start(),{started:true,registered:5});
  assert.equal(added[0][0],'leave-credit-daily');
  assert.deepEqual(added[0][2],{jobId:'repeat:leave-credit-daily',repeat:{pattern:'1 2 * * *'}});
  const localized=createJobScheduler({queue,enabled:true,config:{jobTimezone:'Asia/Kolkata'}});
  await localized.start();
  assert.deepEqual(added.at(-1)[2],{jobId:'repeat:attendance-auto-checkout',repeat:{pattern:'59 23 * * *',tz:'Asia/Kolkata'}});
  await localized.close();
  await enabled.close();
  assert.deepEqual(added.at(-1),['close']);
});

test('worker remains stopped by default and exposes explicit start and close hooks',async()=>{
  const events=[];let processor;
  const disabled=createJobWorker({createWorker:()=>{events.push('created');},queueName:'q',processJob:async()=>{}});
  assert.deepEqual(await disabled.start(),{started:false,reason:'disabled'});
  assert.deepEqual(events,[]);
  const worker={on:(name)=>events.push(`on:${name}`),close:async()=>events.push('closed')};
  const enabled=createJobWorker({enabled:true,queueName:'q',concurrency:3,processJob:async job=>job.name,createWorker:(name,handler,options)=>{processor=handler;events.push([name,options.concurrency]);return worker;}});
  assert.equal(await enabled.start(),worker);
  assert.deepEqual(events.slice(-4),[['q',3],'on:ready','on:completed','on:failed']);
  assert.equal(await processor({name:'job'}),'job');
  await enabled.close();
  assert.equal(events.at(-1),'closed');
});

test('job processor dispatches only injected handlers and rejects missing business work',async()=>{
  const processor=createJobProcessor({[JOBS.LEAVE_CREDIT_DAILY]:async()=>42});
  assert.equal(await processor({name:JOBS.LEAVE_CREDIT_DAILY}),42);
  await assert.rejects(processor({name:JOBS.PROBATION_COMPLETION_DAILY}),/No processor configured/);
  await assert.rejects(processor({name:'unexpected'}),/Unsupported job/);
});
