import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export const buildPgPoolConfig = (config) => {
  let connectionString = config.databaseUrl;
  let urlRequestsSsl = false;
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
    urlRequestsSsl = ["prefer", "require", "verify-ca", "verify-full"].includes(sslMode);
    for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
    connectionString = url.toString();
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  return {
    connectionString,
    max: config.databasePoolMax,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    query_timeout: 35000,
    statement_timeout: 30000,
    application_name: "rigweda-monitor-api-v2",
    ssl: config.databaseSsl || urlRequestsSsl
      ? { rejectUnauthorized: config.databaseSslRejectUnauthorized }
      : undefined,
  };
};

export const createPrismaClient = (config) => {
  const adapter = new PrismaPg(buildPgPoolConfig(config));
  return new PrismaClient({ adapter });
};
