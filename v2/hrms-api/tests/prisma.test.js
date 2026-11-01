import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPgPoolConfig, createPrismaClients } from '../src/database/prisma.js';

test('Prisma PostgreSQL pools preserve TLS requirements and bounded pool settings', () => {
  const pool = buildPgPoolConfig({
    url: 'postgresql://user:pass@localhost:5432/hrms?sslmode=require&application_name=legacy',
    poolMax: 4,
    sslRejectUnauthorized: false,
    applicationName: 'hrms-v2-monitor',
  });

  assert.equal(pool.connectionString, 'postgresql://user:pass@localhost:5432/hrms?application_name=legacy');
  assert.equal(pool.max, 4);
  assert.deepEqual(pool.ssl, { rejectUnauthorized: false });
  assert.equal(pool.application_name, 'hrms-v2-monitor');
  assert.equal(pool.statement_timeout, 30000);
});

test('Prisma PostgreSQL pool honors the legacy explicit SSL mode setting', () => {
  const pool = buildPgPoolConfig({
    url: 'postgresql://user:pass@localhost:5432/hrms',
    sslMode: 'require',
    poolMax: 2,
    sslRejectUnauthorized: false,
    applicationName: 'hrms-v2-payroll',
  });

  assert.deepEqual(pool.ssl, { rejectUnauthorized: false });
});

test('explicit legacy SSL settings take precedence over a URL sslmode flag', () => {
  const pool=buildPgPoolConfig({url:'postgresql://user:pass@localhost/hrms?sslmode=disable',sslMode:'require',poolMax:1,sslRejectUnauthorized:false,applicationName:'hrms-v2'});
  assert.deepEqual(pool.ssl,{rejectUnauthorized:false});
});

test('Prisma client factory creates independent logical monitor and payroll clients', () => {
  const created = [];
  class FakePrismaClient {
    constructor(options) { this.options = options; created.push(this); }
    async $disconnect() { this.disconnected = true; }
  }
  class FakePrismaPg {
    constructor(options) { this.options = options; }
  }

  const clients = createPrismaClients({
    config: {
      monitor: { url: 'postgresql://monitor:secret@localhost/monitor', poolMax: 3 },
      payroll: { url: 'postgresql://payroll:secret@localhost/payroll', poolMax: 2, enabled: true },
    },
    PrismaClient: FakePrismaClient,
    PrismaPg: FakePrismaPg,
  });

  assert.deepEqual(Object.keys(clients), ['monitor', 'payroll', 'close']);
  assert.equal(created.length, 2);
  assert.notEqual(clients.monitor, clients.payroll);
  assert.equal(clients.monitor.options.adapter.options.max, 3);
  assert.equal(clients.payroll.options.adapter.options.max, 2);
  return clients.close().then(() => assert.ok(created.every(client => client.disconnected)));
});

test('Prisma client factory does not create a disabled or unconfigured payroll client', () => {
  const clients = createPrismaClients({
    config: { monitor: null, payroll: { enabled: false } },
    PrismaClient: class { constructor() { throw new Error('must not initialize'); } },
    PrismaPg: class {},
  });

  assert.equal(clients.payroll, null);
  return clients.close();
});
