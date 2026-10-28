import { URL } from "node:url";

const parseBoolean = (value, name, fallback) => {
  if (value === undefined || value === "") return fallback;
  const normalized = String(value).toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  throw new Error(`${name} must be true or false.`);
};

const parsePositiveInteger = (value, name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
};

const assertUrl = (value, name, protocols) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
  if (!protocols.includes(url.protocol)) {
    throw new Error(`${name} must use ${protocols.join(" or ")}.`);
  }
  return url;
};

export const loadConfig = (source = process.env) => {
  const databaseUrl = String(source.DATABASE_URL || "").trim();
  const hrmsBackendUrl = String(source.HRMS_BACKEND_URL || "").trim().replace(/\/+$/, "");
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  if (!hrmsBackendUrl) throw new Error("HRMS_BACKEND_URL is required.");

  const databaseUrlObject = assertUrl(databaseUrl, "DATABASE_URL", ["postgres:", "postgresql:"]);
  const apiBaseUrl = source.PUBLIC_API_URL
    ? assertUrl(String(source.PUBLIC_API_URL).trim(), "PUBLIC_API_URL", ["http:", "https:"]).toString().replace(/\/$/, "")
    : `http://localhost:${parsePositiveInteger(source.PORT, "PORT", 3002, { max: 65535 })}`;
  const sslModes = new Set(["prefer", "require", "verify-ca", "verify-full"]);
  const databaseSsl = parseBoolean(
    source.DATABASE_SSL,
    "DATABASE_SSL",
    sslModes.has(databaseUrlObject.searchParams.get("sslmode")),
  );

  return {
    databaseUrl,
    databaseSsl,
    databaseSslRejectUnauthorized: parseBoolean(
      source.DATABASE_SSL_REJECT_UNAUTHORIZED,
      "DATABASE_SSL_REJECT_UNAUTHORIZED",
      true,
    ),
    databasePoolMax: parsePositiveInteger(source.DATABASE_POOL_MAX, "DATABASE_POOL_MAX", 5, { max: 50 }),
    hrmsBackendUrl,
    hrmsRequestTimeoutMs: parsePositiveInteger(
      source.HRMS_REQUEST_TIMEOUT_MS,
      "HRMS_REQUEST_TIMEOUT_MS",
      10000,
      { min: 100, max: 60000 },
    ),
    monitorSettingsSecret: String(source.MONITOR_SETTINGS_SECRET || source.JWT_SECRET || "").trim(),
    apiBaseUrl,
    corsOrigins: String(source.CORS_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean),
    host: String(source.HOST || "0.0.0.0").trim(),
    port: parsePositiveInteger(source.PORT, "PORT", 3002, { max: 65535 }),
  };
};

export const resolveHrmsProfileUrl = (baseUrl) => {
  const normalized = String(baseUrl).replace(/\/+$/, "");
  if (/\/api\/v1$/i.test(normalized)) return `${normalized}/users/me/profile`;
  if (/\/api$/i.test(normalized)) return `${normalized}/v1/users/me/profile`;
  return `${normalized}/api/v1/users/me/profile`;
};
