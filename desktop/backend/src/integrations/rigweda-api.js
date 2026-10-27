import { buildHrmsApiUrl } from "./hrmsApiUrl.js";

const fetchProfileCandidate = async ({ token, path }) => {
  try {
    const response = await fetch(buildHrmsApiUrl(path), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { ok: false, status: response.status, text: await response.text() };
    }

    return { ok: true, payload: await response.json() };
  } catch (error) {
    return {
      ok: false,
      status: "NETWORK_ERROR",
      text: error instanceof Error ? error.message : String(error),
    };
  }
};

export const getEmployeeProfileFromRigweda = async ({ token }) => {
  const attempts = [
    await fetchProfileCandidate({ token, path: "/employees/me" }),
    await fetchProfileCandidate({ token, path: "/users/me/profile" }),
  ];

  const success = attempts.find((attempt) => attempt.ok);
  if (!success) {
    return null;
  }

  const data = success.payload?.data ?? null;

  if (!data) {
    return null;
  }

  const employeeCode =
    data.employeeCode ||
    data.employee?.employeeCode ||
    data.employee?.code ||
    null;
  const employeeDbId = data.employeeId || data._id || data.id || null;

  return {
    employeeId: employeeDbId || data.userId || null,
    employeeCode,
    employeeDbId,
    userId: data.userId || null,
    organizationId: data.organizationId || data.organization?._id || null,
    raw: data,
  };
};
