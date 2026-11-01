import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config/env.js';
import { connectDatabase } from '../src/database/mongoose.js';
import { connectPrismaClients } from '../src/database/prisma.js';
import { createModels } from '../src/modules/auth/auth.models.js';
import { createPayrollTenantSeedRepository } from '../src/modules/payroll/payroll-tenant-seed.repository.js';
import { createPayrollTenantSeedService } from '../src/modules/payroll/payroll-tenant-seed.service.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const organizationArgs = args.filter(value => value.startsWith('--organization='));
const organizationId = organizationArgs[0]?.slice('--organization='.length);
const unknown = args.filter(value => value !== '--apply' && !value.startsWith('--organization='));
let connection;
let clients;
try {
  if (unknown.length || organizationArgs.length > 1) throw new Error('Usage: npm run seed:payroll-tenants [-- --apply] [--organization=<24-hex-id>]');
  if (organizationId && !mongoose.Types.ObjectId.isValid(organizationId)) throw new Error('organizationId must be a valid MongoDB ObjectId.');
  if (apply && process.env.PAYROLL_DB_ENABLED !== 'true') throw new Error('Set PAYROLL_DB_ENABLED=true before applying payroll tenant synchronization.');

  const configEnv = { ...process.env, MONITOR_DATABASE_URL: '', MONITOR_TOOL_DATABASE_URL: '', DESKTOP_MONITOR_DATABASE_URL: '', MONITOR_PGHOST: '' };
  const config = loadConfig(configEnv);
  if (apply && !config.postgres.payroll?.url) throw new Error('Payroll PostgreSQL URL is required when applying tenant synchronization.');
  connection = await connectDatabase(config);
  const Organization = createModels(connection).Organization;
  /** @type {(organization: any) => Promise<any>} */
  let upsertOrganizationTenant = async () => { throw new Error('Payroll tenant synchronization is read-only in dry-run mode.'); };
  if (apply) {
    clients = await connectPrismaClients({ monitor: null, payroll: config.postgres.payroll });
    upsertOrganizationTenant = createPayrollTenantSeedRepository({ prisma: clients.payroll }).upsertOrganizationTenant;
  }
  const sync = createPayrollTenantSeedService({ Organization, upsertOrganizationTenant });
  const result = await sync({ organizationId, apply });
  if (!apply) {
    console.log(`Dry run: ${result.organizationCount} organization(s) match payroll tenant synchronization.`);
    for (const organization of result.organizations) console.log(`  ${organization.organizationId} ${organization.code || ''} ${organization.name || ''}`.trimEnd());
  } else {
    console.log(`Payroll tenant synchronization completed for ${result.organizationCount} organization(s).`);
    for (const tenant of result.tenants) console.log(`  organization=${tenant.organization_id} tenant=${tenant.id} name=${tenant.legal_name}`);
  }
} catch (error) {
  const safeMessage = /^(Usage:|organizationId must be a valid MongoDB ObjectId\.|MONGODB_URI is required\.|JWT_SECRET is required\.|Set PAYROLL_DB_ENABLED=true|Payroll PostgreSQL URL is required)/.test(error.message || '')
    ? error.message
    : error.completedCount !== undefined
      ? `Payroll tenant synchronization stopped after ${error.completedCount} successful organization(s). Re-run after reviewing the configured database.`
      : 'Payroll tenant synchronization failed. Check MongoDB/PostgreSQL availability and review the existing payroll schema.';
  console.error(safeMessage);
  process.exitCode = 1;
} finally {
  await clients?.close().catch(() => {});
  await connection?.close().catch(() => {});
}
