import { getEnv } from "../config/env.js";

const API_V1_PATH = "/api/v1";

export const buildHrmsApiUrl = (path) => {
  const configuredBase = getEnv().hrmsBackendUrl.replace(/\/+$/, "");
  const baseWithoutApiVersion = configuredBase.replace(/\/api(?:\/v1)?$/i, "");
  const apiBase = `${baseWithoutApiVersion}${API_V1_PATH}`;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const relativePath = normalizedPath.replace(/^\/api(?:\/v1)?(?=\/|$)/i, "");

  return `${apiBase}${relativePath}`;
};
