const safeConfigurationMessages = new Set([
  'MONGODB_URI is required.',
  'JWT_SECRET is required.',
  'PAYROLL DB is enabled but Postgres config is missing.',
]);

export const startupFailureMessage = error => {
  const message = typeof error?.message === 'string' ? error.message : '';
  if (safeConfigurationMessages.has(message) || /^[A-Z][A-Z0-9_]* must be an integer between \d+ and \d+\.$/.test(message)) {
    return `HRMS v2 startup failed: ${message}`;
  }
  if (['MongoServerSelectionError', 'MongooseServerSelectionError'].includes(error?.name)) {
    return 'HRMS v2 startup failed: MongoDB is unreachable. Check MONGODB_URI and confirm that the configured MongoDB server is running.';
  }
  if (error?.name === 'PrismaClientInitializationError') {
    return 'HRMS v2 startup failed: a configured PostgreSQL database is unavailable or misconfigured. Check the enabled database URLs and availability.';
  }
  if (error?.code === 'EADDRINUSE') {
    return 'HRMS v2 startup failed: the configured port is already in use. Check PORT or stop the process using that port.';
  }
  return 'HRMS v2 startup failed. Check v2/hrms-api/.env configuration and database availability.';
};
