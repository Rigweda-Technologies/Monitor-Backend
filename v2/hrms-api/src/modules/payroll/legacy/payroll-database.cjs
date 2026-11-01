const { current } = require('./context.cjs');
const dateColumns = new Set(['attendance_cutoff_date','bill_date','date_of_exit','date_of_joining','day_date','effective_from','effective_to','pay_date','period_end','period_start','from_date','to_date']);
const normalizeDateRows = rows => rows.map(row => {
  if (!row || typeof row !== 'object') return row;
  const normalized = { ...row };
  for (const [key, value] of Object.entries(normalized)) {
    if (dateColumns.has(key) && value instanceof Date && !Number.isNaN(value.getTime())) normalized[key] = value.toISOString();
  }
  return normalized;
});
const getExecutor = kind => {
  const context = current();
  const executor = kind === 'monitor' ? context?.monitor : context?.payroll;
  if (!executor) throw Object.assign(new Error(`${kind === 'monitor' ? 'Monitor' : 'Payroll'} Prisma database is unavailable.`), { code: 'V2_PAYROLL_DATABASE_UNAVAILABLE' });
  return executor;
};
const query = async (kind, statement, values = []) => {
  const context = current();
  const trimmed = String(statement).trim().replace(/;$/, '').toUpperCase();
  // Legacy methods bracket operations with transaction commands. The v2 service
  // owns one Prisma interactive transaction per request operation.
  if (kind === 'payroll' && trimmed === 'BEGIN') return { rows: [], rowCount: 0 };
  if (kind === 'payroll' && trimmed === 'COMMIT') return { rows: [], rowCount: 0 };
  if (kind === 'payroll' && trimmed === 'ROLLBACK') {
    context.rollbackOnly = true;
    return { rows: [], rowCount: 0 };
  }
  const executor = getExecutor(kind);
  const statementText = String(statement).trim();
  const returnsRows = /^(SELECT|WITH|VALUES|SHOW|EXPLAIN)\b/i.test(statementText) || /\bRETURNING\b/i.test(statementText);
  if (!returnsRows) return { rows: [], rowCount: await executor.execute(statement, values) };
  const result = await executor.query(statement, values);
  return { rows: normalizeDateRows(result.rows), rowCount: result.rowCount };
};
const makePool = kind => ({
  async connect() {
    getExecutor(kind);
    return { query: (statement, values) => query(kind, statement, values), release() {} };
  },
  query: (statement, values) => query(kind, statement, values),
});
const payrollPool = makePool('payroll');
const monitorPool = makePool('monitor');
module.exports = {
  getPayrollPgPool: async () => payrollPool,
  getMonitorPgPool: async () => monitorPool,
};
