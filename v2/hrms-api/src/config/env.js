const integer = (env, key, fallback, min = 1, max = 2147483647) => {
  const value = Number(env[key] ?? fallback);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${key} must be an integer between ${min} and ${max}.`);
  return value;
};
const boolean = (env, key, fallback = false) => {
  if (env[key] === undefined) return fallback;
  if (!['true', 'false'].includes(env[key])) throw new Error(`${key} must be true or false.`);
  return env[key] === 'true';
};
const numeric = (env, key, fallback) => {
  if (env[key] === undefined || env[key] === '') return fallback;
  const value = Number(env[key]);
  return Number.isFinite(value) ? value : fallback;
};
const pgUrl = (explicitUrl, env, keys) => {
  if (explicitUrl) return explicitUrl;
  const [hostKey, portKey, databaseKey, userKey, passwordKey] = keys;
  if (![hostKey, databaseKey, userKey, passwordKey].every(key => env[key])) return undefined;
  const url = new URL(`postgresql://${encodeURIComponent(env[userKey])}:${encodeURIComponent(env[passwordKey])}@${env[hostKey]}:${env[portKey] || '5432'}/${encodeURIComponent(env[databaseKey])}`);
  return url.toString();
};
export const loadConfig = (env = process.env) => {
  const mongoUri = env.MONGODB_URI || env.MONGO_URI;
  if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri || '')) throw new Error('MONGODB_URI is required.');
  if (!env.JWT_SECRET?.trim()) throw new Error('JWT_SECRET is required.');
  const payrollEnabled = env.PAYROLL_DB_ENABLED === 'true'
    ? true
    : env.PAYROLL_DB_ENABLED === 'false'
      ? false
      : Boolean(env.PAYROLL_DATABASE_URL || env.PGHOST);
  const monitorUrl = pgUrl(env.MONITOR_DATABASE_URL || env.MONITOR_TOOL_DATABASE_URL || env.DESKTOP_MONITOR_DATABASE_URL, env,
    ['MONITOR_PGHOST', 'MONITOR_PGPORT', 'MONITOR_PGDATABASE', 'MONITOR_PGUSER', 'MONITOR_PGPASSWORD']);
  const payrollUrl = pgUrl(env.PAYROLL_DATABASE_URL, env, ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD']);
  if (payrollEnabled && !payrollUrl) throw new Error('PAYROLL DB is enabled but Postgres config is missing.');
  return {
    mongoUri, jwtSecret: env.JWT_SECRET, jwtExpiresIn: env.JWT_EXPIRES_IN || '1d',
    port: integer(env, 'PORT', 8002, 1, 65535), host: env.HOST || '127.0.0.1',
    poolMax: integer(env, 'MONGODB_POOL_MAX', 5), timeoutMs: integer(env, 'DEPENDENCY_TIMEOUT_MS', 10000),
    corsOrigins: [...new Set([...['http://localhost:3000','http://localhost:8080','http://localhost:8081','http://localhost:3002','http://localhost:3001','https://rigweda-hrms-frontend.vercel.app'], ...(env.CORS_ALLOWED_ORIGINS || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean)])],
    trustProxy: env.TRUST_PROXY ? env.TRUST_PROXY.split(',').map(s => s.trim()).filter(Boolean) : false,
    tokenListLimit: integer(env, 'TOKEN_LIST_LIMIT', 10), maxActiveLogins: integer(env, 'MAX_ACTIVE_LOGINS_PER_USER_DEFAULT', 1),
    bcryptRounds: integer(env, 'BCRYPT_SALT_ROUNDS', 10, 4, 16),
    publicLimit: integer(env, 'PUBLIC_RATE_LIMIT', 10000), authLimit: integer(env, 'AUTH_RATE_LIMIT', 3000),
    rateWindowMs: 15 * 60 * 1000,
    smtp: { host: env.SMTP_HOST, port: integer(env, 'SMTP_PORT', 587, 1, 65535), secure: boolean(env, 'SMTP_SECURE', true), user: env.SMTP_USER, pass: env.SMTP_PASS, from: env.SMTP_FROM || env.SMTP_USER },
    frontendLoginUrl: env.FRONTEND_LOGIN_URL || '', hrContactEmail: env.HR_CONTACT_EMAIL || '',
    face: { apiKey: env.FACEPP_API_KEY, apiSecret: env.FACEPP_API_SECRET,
      compareUrl: env.FACEPP_COMPARE_URL || 'https://api-us.faceplusplus.com/facepp/v3/compare',
      detectUrl: env.FACEPP_DETECT_URL || 'https://api-us.faceplusplus.com/facepp/v3/detect',
      confidence: integer(env, 'FACE_MATCH_MIN_CONFIDENCE', 70, 0, 100), fallback: boolean(env, 'FACE_LOGIN_ALLOW_PASSWORD_FALLBACK') },
    payroll: { idempotencyRequired: boolean(env, 'PAYROLL_IDEMPOTENCY_REQUIRED') },
    payrollOptions: {
      computeAsyncDefault:boolean(env,'PAYROLL_COMPUTE_ASYNC_DEFAULT'),
      defaultTimezone:env.PAYROLL_DEFAULT_TIMEZONE||'Asia/Kolkata',
      countryCode:env.PAYROLL_COUNTRY||'IN', stateCode:env.PAYROLL_STATE_CODE||'TS',
      defaultSalaryPayDay:Math.min(31,Math.max(1,Math.trunc(numeric(env,'PAYROLL_DEFAULT_SALARY_PAY_DAY',30)))),
      overtimeMultiplier:numeric(env,'PAYROLL_OT_MULTIPLIER',1),
      pfWageThreshold:numeric(env,'PAYROLL_PF_WAGE_THRESHOLD',15000), esiWageThreshold:numeric(env,'PAYROLL_ESI_WAGE_THRESHOLD',21000),
      idempotencyInProgressTimeoutSeconds:numeric(env,'PAYROLL_IDEMPOTENCY_IN_PROGRESS_TIMEOUT_SEC',600),
      computeJobAttempts:numeric(env,'PAYROLL_COMPUTE_JOB_ATTEMPTS',5), computeJobBackoffMs:numeric(env,'PAYROLL_COMPUTE_JOB_BACKOFF_MS',5000),
      computeJobKeepCompleted:numeric(env,'PAYROLL_COMPUTE_JOB_KEEP_COMPLETED',1000), computeJobKeepFailed:numeric(env,'PAYROLL_COMPUTE_JOB_KEEP_FAILED',2000),
      ifscLookupBaseUrl:env.IFSC_LOOKUP_BASE_URL||'https://ifsc.razorpay.com', ifscLookupTimeoutMs:numeric(env,'IFSC_LOOKUP_TIMEOUT_MS',10000),
    },
    jobs: {
      jobQueueName:env.JOB_QUEUE_NAME||'rigweda-system-jobs',
      schedulerEnabled:boolean(env,'ENABLE_JOB_SCHEDULER'),
      workerEnabled:boolean(env,'ENABLE_JOB_WORKER'),
      workerConcurrency:integer(env,'JOB_WORKER_CONCURRENCY',1,1,100),
      jobTimezone:env.JOB_TIMEZONE||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',
      leaveCreditCron:env.JOB_CRON_LEAVE_CREDIT||'0 0 * * *',
      leaveCarryForwardCron:env.JOB_CRON_LEAVE_CARRY_FORWARD||'0 0 * * *',
      probationCompletionCron:env.JOB_CRON_PROBATION_COMPLETION||'0 0 * * *',
      organizationDocumentExpiryCron:env.JOB_CRON_ORGANIZATION_DOCUMENT_EXPIRY||'30 8 * * *',
      attendanceAutoCheckoutCron:env.JOB_CRON_ATTENDANCE_AUTO_CHECKOUT||'59 23 * * *',
    },
    cloudinary: { cloudName: env.CLOUDINARY_CLOUD_NAME, apiKey: env.CLOUDINARY_API_KEY, apiSecret: env.CLOUDINARY_API_SECRET },
    firebase: { serviceAccountJson: env.FIREBASE_SERVICE_ACCOUNT_JSON, projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY, androidChannelId: env.FCM_ANDROID_CHANNEL_ID },
    r2: { accountId: env.CLOUDFLARE_ACCOUNT_ID, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY, bucket: env.R2_BUCKET_NAME || 'rigweda-monitor-updates', urlExpiresSeconds: integer(env, 'MONITOR_UPDATE_URL_EXPIRES_SECONDS', 900), defaultDownloadUrl: env.MONITOR_RELEASE_SIGNED_URL || env.MONITOR_UPDATE_DOWNLOAD_URL || '' },
    postgres: {
      monitor: monitorUrl ? {
        url: monitorUrl,
        poolMax: integer(env, 'MONITOR_PG_POOL_MAX', 20),
        sslMode: env.MONITOR_PG_SSL_MODE || '',
        sslRejectUnauthorized: (env.MONITOR_PG_SSL_MODE || '').toLowerCase() !== 'require',
      } : null,
      payroll: payrollEnabled ? {
        url: payrollUrl,
        poolMax: integer(env, 'PAYROLL_PG_POOL_MAX', 20),
        enabled: true,
        sslMode: env.PAYROLL_PG_SSL_MODE || '',
        sslRejectUnauthorized: (env.PAYROLL_PG_SSL_MODE || '').toLowerCase() !== 'require',
      } : { enabled: false },
    },
  };
};
