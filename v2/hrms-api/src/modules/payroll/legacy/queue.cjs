const { current } = require('./context.cjs');
exports.JOBS = { PAYROLL_RUN_COMPUTE: 'payroll-run-compute' };
exports.getJobQueue = () => {
  const queue = current()?.queue;
  if (!queue) throw Object.assign(new Error('Payroll compute queue is not configured.'), { code: 'V2_PAYROLL_QUEUE_UNAVAILABLE' });
  return queue;
};
