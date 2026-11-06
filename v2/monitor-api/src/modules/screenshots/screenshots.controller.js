import { HttpError } from "../../errors.js";
import { completeUploadSessionValidation, createScreenshotValidation, createUploadSessionValidation } from "./screenshots.validation.js";

const multipartScreenshot = async (request) => {
  const fields = new Map();
  let file = null;
  try {
    for await (const part of request.parts()) {
      if (part.type === "file") {
        if (part.fieldname !== "screenshot" || file) throw new HttpError(400, "VALIDATION_ERROR", "Exactly one screenshot file is required.");
        const buffer = await part.toBuffer();
        if (part.file.truncated || buffer.length === 0) throw new HttpError(413, "SCREENSHOT_TOO_LARGE", "Screenshot is empty or exceeds the 25 MiB upload limit.");
        file = { buffer };
      } else {
        if (!new Set(["capturedAt"]).has(part.fieldname) || fields.has(part.fieldname)) throw new HttpError(400, "VALIDATION_ERROR", "Only a single capturedAt field is supported.");
        fields.set(part.fieldname, part.value);
      }
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (!String(request.headers["content-type"] || "").toLowerCase().startsWith("multipart/form-data")) return { file: null, capturedAt: undefined };
    if (error.code === "FST_REQ_FILE_TOO_LARGE") throw new HttpError(413, "SCREENSHOT_TOO_LARGE", "Screenshot exceeds the 25 MiB upload limit.");
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid multipart screenshot upload.");
  }
  return { file, capturedAt: fields.get("capturedAt") };
};

const formatJoiErrors = (error) => error.details.map((item) => ({ field: item.path.join(".") || "body", message: item.message, type: item.type }));

export const createScreenshotsController = ({ screenshotsService }) => ({
  async createDirect(request, reply) {
    const input = await multipartScreenshot(request);
    if (!input.file) return reply.code(400).send({ success: false, message: "Screenshot file is required" });
    const parsedCapturedAt = new Date(input.capturedAt);
    const { error, value } = createScreenshotValidation.validate({
      employeeId: request.auth.employeeId || request.auth.userId,
      capturedAt: input.capturedAt,
      dateFolder: Number.isNaN(parsedCapturedAt.getTime()) ? "" : parsedCapturedAt.toISOString().slice(0, 10).replaceAll("-", "_"),
      screenshot: { filename: "screenshot", mimetype: "application/octet-stream", buffer: input.file.buffer, fileSize: input.file.buffer.length },
    }, { abortEarly: false, stripUnknown: true });
    if (error) return reply.code(400).send({ success: false, message: "Validation failed", errorCode: "VALIDATION_ERROR", errors: formatJoiErrors(error) });
    const result = await screenshotsService.createDirectScreenshot({ auth: request.auth, file: value.screenshot, capturedAt: value.capturedAt });
    return reply.code(201).send({ success: true, data: result });
  },
  async createUploadSession(request, reply) {
    const { error, value } = createUploadSessionValidation.validate(request.body ?? {}, { abortEarly: false, stripUnknown: true });
    if (error) return reply.code(400).send({ success: false, message: "Validation failed", errorCode: "VALIDATION_ERROR", errors: formatJoiErrors(error) });
    const result = await screenshotsService.createUploadSession({ auth: request.auth, ...value });
    return reply.code(201).send({ success: true, data: result });
  },
  async completeUploadSession(request, reply) {
    const { error, value } = completeUploadSessionValidation.validate(request.body ?? {}, { abortEarly: false, stripUnknown: true });
    if (error) return reply.code(400).send({ success: false, message: "Validation failed", errorCode: "VALIDATION_ERROR", errors: formatJoiErrors(error) });
    const result = await screenshotsService.completeUploadSession({ auth: request.auth, batchId: request.params.batchId, ...value });
    return reply.code(200).send({ success: true, data: result });
  },
});
