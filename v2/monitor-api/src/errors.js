export class HttpError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class SessionRejectedError extends HttpError {
  constructor() {
    super(401, "UNAUTHENTICATED", "Your session is invalid or expired.");
    this.name = "SessionRejectedError";
  }
}

export class MissingOrganizationIdentityError extends HttpError {
  constructor() {
    super(403, "ORGANIZATION_USER_REQUIRED", "An organization user session is required.");
    this.name = "MissingOrganizationIdentityError";
  }
}

export class HrmsUnavailableError extends HttpError {
  constructor() {
    super(503, "SESSION_VERIFICATION_UNAVAILABLE", "Session verification is unavailable. Please retry.");
    this.name = "HrmsUnavailableError";
  }
}

export class DeviceOwnershipConflictError extends HttpError {
  constructor() {
    super(409, "DEVICE_OWNERSHIP_CONFLICT", "This device is already assigned to another employee.");
    this.name = "DeviceOwnershipConflictError";
  }
}

export class InvalidBrowserHistoryEntryError extends HttpError {
  constructor(message = "Browser history entry is invalid.") {
    super(400, "VALIDATION_ERROR", message);
    this.name = "InvalidBrowserHistoryEntryError";
  }
}
