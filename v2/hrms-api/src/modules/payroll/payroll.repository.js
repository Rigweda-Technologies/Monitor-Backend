/**
 * Prisma-backed access to the pre-existing payroll schema.
 *
 * The legacy schema is intentionally accessed as parameterized SQL because it
 * has tenant-specific lifecycle semantics and is not managed by Prisma.
 */
const assertStatement = statement => {
  if (typeof statement !== 'string' || !statement.trim()) throw new TypeError('A SQL statement is required.');
};

// node-postgres returns int8 values as decimal strings by default. Prisma's
// PostgreSQL adapter returns JavaScript BigInt values, which also cannot be
// JSON-serialized. Keep the legacy payroll API's wire representation.
const normalizePgValue = value => {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(normalizePgValue);
  if (value && typeof value === 'object' && typeof value.toFixed === 'function') return value;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizePgValue(item)]));
  }
  return value;
};

const createExecutor = client => ({
  async query(statement, values = []) {
    assertStatement(statement);
    const rows = normalizePgValue(await client.$queryRawUnsafe(statement, ...values));
    return { rows, rowCount: rows.length };
  },
  async execute(statement, values = []) {
    assertStatement(statement);
    return client.$executeRawUnsafe(statement, ...values);
  },
});

export const createPayrollRepository = ({ prisma }) => {
  if (!prisma || typeof prisma.$transaction !== 'function') throw new TypeError('A Prisma payroll client is required.');
  const executor = createExecutor(prisma);
  return {
    ...executor,
    transaction: work => {
      if (typeof work !== 'function') throw new TypeError('Transaction callback is required.');
      return prisma.$transaction(async tx => work(createExecutor(tx)), { maxWait: 10000, timeout: 120000 });
    },
  };
};
