import jwt from "jsonwebtoken";
import {
  HrmsUnavailableError,
  MissingOrganizationIdentityError,
  SessionRejectedError,
} from "../errors.js";
import { resolveHrmsProfileUrl } from "../config/env.js";

const getText = (value) => (typeof value === "string" ? value.trim() : "");

const getProfileEmployeeName = (profile) => {
  const firstLast = [profile.firstName, profile.lastName].map(getText).filter(Boolean).join(" ");
  return firstLast || getText(profile.name) || getText(profile.email) || null;
};

export const createHrmsSessionVerifier = ({
  baseUrl,
  timeoutMs = 10000,
  fetchImpl = globalThis.fetch,
}) => {
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl must be a function.");
  const profileUrl = resolveHrmsProfileUrl(baseUrl);

  return async (token) => {
    let response;
    try {
      response = await fetchImpl(profileUrl, {
        method: "GET",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      throw new HrmsUnavailableError();
    }

    if (response.status === 401 || response.status === 403) throw new SessionRejectedError();
    if (!response.ok) throw new HrmsUnavailableError();

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new HrmsUnavailableError();
    }
    const profile = payload?.success === true && payload.data && typeof payload.data === "object"
      ? payload.data
      : null;
    if (!profile || profile.mustChangePassword) throw new SessionRejectedError();

    const claims = jwt.decode(token);
    if (!claims || typeof claims !== "object") throw new SessionRejectedError();

    const userId = getText(claims.userId || claims._id || claims.sub || profile.userId);
    const organizationId = getText(
      profile.organizationId || profile.organization?._id || claims.organizationId || claims.org,
    );
    if (!userId || !organizationId) throw new MissingOrganizationIdentityError();

    const employeeId = getText(profile.employeeId || profile._id || profile.id || profile.userId || userId);
    const rawTimezone = profile.timezone || profile.organization?.timezone || profile.orgSettings?.timezone;

    return {
      userId,
      organizationId,
      employeeId,
      employeeName: getProfileEmployeeName(profile),
      activityTimeZone: getText(rawTimezone) || "Asia/Kolkata",
    };
  };
};
