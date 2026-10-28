import { MissingOrganizationIdentityError, HttpError } from "../../errors.js";

export const createLocationService = ({ repository, now = () => new Date() }) => ({
  async receiveReport({ auth, report }) {
    const organizationId = String(auth.organizationId || "").trim();
    const employeeId = String(auth.employeeId || auth.userId || "").trim();
    const deviceId = String(report.device_id || "").trim();
    if (!organizationId || !employeeId) throw new MissingOrganizationIdentityError();
    if (!deviceId) throw new HttpError(400, "VALIDATION_ERROR", "device_id is required.");

    await repository.assertDeviceOwner({ organizationId, employeeId, deviceId });
    return {
      success: true,
      message: "Location report received",
      data: { device_id: report.device_id, receivedAt: now().toISOString(), source: report.source },
    };
  },
});
