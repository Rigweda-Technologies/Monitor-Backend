const SSL_QUERY_OPTIONS = ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'ssl'];

export const buildPgPoolConfig = ({ url, poolMax, sslMode: configuredSslMode = '', sslRejectUnauthorized = true, applicationName }) => {
  if (typeof url !== 'string' || !url.trim()) throw new Error('A PostgreSQL connection URL is required.');

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('PostgreSQL connection URL must be valid.');
  }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('PostgreSQL connection URL must use postgres or postgresql.');

  const sslMode = (configuredSslMode || parsed.searchParams.get('sslmode') || '').toLowerCase();
  for (const key of SSL_QUERY_OPTIONS) parsed.searchParams.delete(key);
  const tlsRequired = ['prefer', 'require', 'verify-ca', 'verify-full'].includes(sslMode);

  return {
    connectionString: parsed.toString(),
    max: poolMax,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    query_timeout: 35000,
    statement_timeout: 30000,
    application_name: applicationName,
    ssl: tlsRequired ? { rejectUnauthorized: sslRejectUnauthorized } : undefined,
  };
};

const createClient = ({ definition, applicationName, PrismaClient, PrismaPg }) => {
  if (!definition?.url) return null;
  const adapter = new PrismaPg(buildPgPoolConfig({ ...definition, applicationName }));
  return new PrismaClient({ adapter });
};

export const createPrismaClients = ({ config, PrismaClient, MonitorPrismaClient = PrismaClient, PayrollPrismaClient = PrismaClient, PrismaPg }) => {
  const monitor = createClient({ definition: config.monitor, applicationName: 'rigweda-hrms-v2-monitor', PrismaClient: MonitorPrismaClient, PrismaPg });
  const payroll = config.payroll?.enabled
    ? createClient({ definition: config.payroll, applicationName: 'rigweda-hrms-v2-payroll', PrismaClient: PayrollPrismaClient, PrismaPg })
    : null;
  let closed = false;
  return {
    monitor,
    payroll,
    close: async () => {
      if (closed) return;
      closed = true;
      await Promise.all([monitor?.$disconnect(), payroll?.$disconnect()].filter(Boolean));
    },
  };
};

export const connectPrismaClients = async config => {
  if (!config.monitor && !config.payroll?.enabled) return createPrismaClients({ config, PrismaClient: class {}, PrismaPg: class {} });
  const [monitorClient, payrollClient, { PrismaPg }] = await Promise.all([
    config.monitor ? import('../../generated/monitor-client/index.js') : null,
    config.payroll?.enabled ? import('../../generated/payroll-client/index.js') : null,
    import('@prisma/adapter-pg'),
  ]);
  return createPrismaClients({
    config,
    MonitorPrismaClient: monitorClient?.PrismaClient,
    PayrollPrismaClient: payrollClient?.PrismaClient,
    PrismaPg,
  });
};
