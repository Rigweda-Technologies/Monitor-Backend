import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createPayrollRepository } from '../src/modules/payroll/payroll.repository.js';

const require = createRequire(import.meta.url);
const { withPayrollContext } = require('../src/modules/payroll/legacy/context.cjs');
const payrollDatabase = require('../src/modules/payroll/legacy/payroll-database.cjs');

test('payroll repository passes SQL values as bound Prisma parameters', async () => {
  const calls = [];
  const prisma = {
    async $queryRawUnsafe(...args) { calls.push(args); return [{ id: 'row-1' }]; },
    async $executeRawUnsafe(...args) { calls.push(args); return 1; },
    async $transaction(work) { return work(this); },
  };
  const repository = createPayrollRepository({ prisma });
  const result = await repository.query('SELECT * FROM payroll_tenants WHERE organization_id = $1', ["x' OR 1=1 --"]);
  assert.deepEqual(result.rows, [{ id: 'row-1' }]);
  assert.deepEqual(calls[0], ['SELECT * FROM payroll_tenants WHERE organization_id = $1', "x' OR 1=1 --"]);
  await repository.execute('UPDATE pay_groups SET name = $1 WHERE id = $2', ['Monthly', 'group-id']);
  assert.deepEqual(calls[1], ['UPDATE pay_groups SET name = $1 WHERE id = $2', 'Monthly', 'group-id']);
});

test('payroll repository preserves PostgreSQL int8 wire values as strings', async () => {
  const prisma = {
    async $queryRawUnsafe() { return [{ id: 9007199254740993n, nested: { auditId: 12n }, labels: [1n, 2n] }]; },
    async $executeRawUnsafe() { return 0; },
    async $transaction(work) { return work(this); },
  };
  const repository = createPayrollRepository({ prisma });
  const result = await repository.query('SELECT id');
  assert.deepEqual(result.rows, [{ id: '9007199254740993', nested: { auditId: '12' }, labels: ['1', '2'] }]);
});

test('payroll repository runs related writes on the same Prisma transaction client', async () => {
  const events = [];
  const tx = {
    async $queryRawUnsafe(sql, ...values) { events.push(['query', sql, ...values]); return []; },
    async $executeRawUnsafe(sql, ...values) { events.push(['execute', sql, ...values]); return 1; },
  };
  const prisma = {
    async $queryRawUnsafe() { throw new Error('outside transaction'); },
    async $executeRawUnsafe() { throw new Error('outside transaction'); },
    async $transaction(work) { events.push(['begin']); try { const value = await work(tx); events.push(['commit']); return value; } catch (error) { events.push(['rollback']); throw error; } },
  };
  const repository = createPayrollRepository({ prisma });
  await assert.rejects(repository.transaction(async transaction => {
    await transaction.execute('UPDATE payroll_runs SET status = $1 WHERE id = $2', ['processing', 'run-id']);
    await transaction.query('SELECT id FROM payroll_run_employees WHERE run_id = $1', ['run-id']);
    throw new Error('force rollback');
  }), /force rollback/);
  assert.deepEqual(events.map(event => event[0]), ['begin', 'execute', 'query', 'rollback']);
  assert.equal(events[1][2], 'processing');
  assert.equal(events[2][2], 'run-id');
});

test('payroll repository rejects missing clients and empty SQL', async () => {
  assert.throws(() => createPayrollRepository({ prisma: null }), /Prisma payroll client/);
  const repository = createPayrollRepository({ prisma: { $queryRawUnsafe() {}, $executeRawUnsafe() {}, $transaction() {} } });
  await assert.rejects(repository.query('  '), /SQL statement/);
});

test('legacy payroll query interface delegates reads and writes to the active Prisma transaction', async () => {
  const calls = [];
  const transaction = {
    async query(statement, values) { calls.push(['query', statement, values]); return { rows: [{ id: 'row-1', period_start: new Date('2026-10-01T00:00:00.000Z'), created_at: new Date('2026-10-01T00:00:00.000Z') }], rowCount: 1 }; },
    async execute(statement, values) { calls.push(['execute', statement, values]); return 1; },
  };
  await withPayrollContext({ payroll: transaction }, async () => {
    const pool = await payrollDatabase.getPayrollPgPool();
    const client = await pool.connect();
    await client.query('BEGIN');
    assert.deepEqual((await client.query('SELECT id FROM payroll_runs WHERE id = $1', ['run-1'])).rows, [{ id: 'row-1', period_start: '2026-10-01T00:00:00.000Z', created_at: new Date('2026-10-01T00:00:00.000Z') }]);
    await client.query('UPDATE payroll_runs SET status = $1 WHERE id = $2', ['locked','run-1']);
    await client.query('COMMIT');
    client.release();
  });
  assert.deepEqual(calls, [
    ['query','SELECT id FROM payroll_runs WHERE id = $1',['run-1']],
    ['execute','UPDATE payroll_runs SET status = $1 WHERE id = $2',['locked','run-1']],
  ]);
});
