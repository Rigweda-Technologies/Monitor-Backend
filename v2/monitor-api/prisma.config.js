export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    // A local-only placeholder makes client generation independent of any database.
    // Database commands must use an explicitly isolated target and are not part of this slice.
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/monitor_v2_schema_only"
  }
};
