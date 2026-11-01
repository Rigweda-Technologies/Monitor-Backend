export const JOBS=Object.freeze({
  LEAVE_CREDIT_DAILY:'leave-credit-daily',
  LEAVE_CARRY_FORWARD_DAILY:'leave-carry-forward-daily',
  PROBATION_COMPLETION_DAILY:'probation-completion-daily',
  ORGANIZATION_DOCUMENT_EXPIRY_DAILY:'organization-document-expiry-daily',
  ATTENDANCE_AUTO_CHECKOUT:'attendance-auto-checkout',
  PAYROLL_RUN_COMPUTE:'payroll-run-compute',
});
export const DEFAULT_JOB_QUEUE_NAME='rigweda-system-jobs';
const repeatDefinitions=Object.freeze([
  [JOBS.LEAVE_CREDIT_DAILY,'JOB_CRON_LEAVE_CREDIT','leaveCreditCron','0 0 * * *'],
  [JOBS.LEAVE_CARRY_FORWARD_DAILY,'JOB_CRON_LEAVE_CARRY_FORWARD','leaveCarryForwardCron','0 0 * * *'],
  [JOBS.PROBATION_COMPLETION_DAILY,'JOB_CRON_PROBATION_COMPLETION','probationCompletionCron','0 0 * * *'],
  [JOBS.ORGANIZATION_DOCUMENT_EXPIRY_DAILY,'JOB_CRON_ORGANIZATION_DOCUMENT_EXPIRY','organizationDocumentExpiryCron','30 8 * * *'],
  [JOBS.ATTENDANCE_AUTO_CHECKOUT,'JOB_CRON_ATTENDANCE_AUTO_CHECKOUT','attendanceAutoCheckoutCron','59 23 * * *'],
]);
export const getRepeatableJobs=(config={})=>repeatDefinitions.map(([name,envKey,configKey,fallback])=>({name,cron:config[envKey]||config[configKey]||fallback,...(name===JOBS.ATTENDANCE_AUTO_CHECKOUT&&(config.jobTimezone||config.timezone)?{timezone:config.jobTimezone||config.timezone}:{})}));
export const getJobQueueName=(config={})=>config.JOB_QUEUE_NAME||config.jobQueueName||config.queueName||DEFAULT_JOB_QUEUE_NAME;

export const createJobScheduler=({queue,config={},enabled=false,ownsQueue=false}={})=>{
  let started=false,closed=false;
  return {
    async start(){
      if(!enabled)return {started:false,reason:'disabled'};
      if(closed)throw new Error('Scheduler is closed');
      if(started)return {started:true,registered:getRepeatableJobs(config).length};
      if(typeof queue?.add!=='function')throw new TypeError('Enabled scheduler requires an injected queue');
      const jobs=getRepeatableJobs(config);
      for(const job of jobs)await queue.add(job.name,{}, {jobId:`repeat:${job.name}`,repeat:{pattern:job.cron,...(job.timezone?{tz:job.timezone}:{})}});
      started=true;
      return {started:true,registered:jobs.length};
    },
    async close(){if(closed)return;closed=true;if(ownsQueue&&queue?.close)await queue.close();},
  };
};

export const createJobProcessor=handlers=>async job=>{
  const handler=handlers?.[job?.name];
  if(!handler){if(Object.values(JOBS).includes(job?.name))throw new Error(`No processor configured for job: ${job.name}`);throw new Error(`Unsupported job: ${job?.name||'unknown'}`);}
  return handler(job);
};

export const createJobWorker=({queueName=getJobQueueName(),connection,concurrency=1,processJob,createWorker,enabled=false,onReady=()=>{},onCompleted=()=>{},onFailed=()=>{},closeConnection=null}={})=>{
  let worker=null,closed=false;
  return {
    async start(){
      if(!enabled)return {started:false,reason:'disabled'};
      if(closed)throw new Error('Worker is closed');
      if(worker)return worker;
      if(typeof processJob!=='function'||typeof createWorker!=='function')throw new TypeError('Enabled worker requires an injected worker factory and processor');
      worker=createWorker(queueName,processJob,{connection,concurrency});
      worker.on('ready',onReady);worker.on('completed',onCompleted);worker.on('failed',onFailed);
      return worker;
    },
    async close(){
      if(closed)return;closed=true;
      if(worker?.close)await worker.close();
      if(closeConnection)await closeConnection();
    },
  };
};
