import { createScreenshotsController } from "./screenshots.controller.js";

const errorSchema = {
  type: "object", required: ["success", "message"],
  properties: {
    success: { type: "boolean", const: false }, message: { type: "string" }, errorCode: { type: "string" },
    errors: { type: "array", items: { type: "object", properties: { field: { type: "string" }, message: { type: "string" }, type: { type: "string" } } } },
  },
};
const screenshotItem = {
    type: "object", additionalProperties: false,
  required: ["clientScreenshotId", "capturedAt", "originalFileName", "mimeType", "sha256", "sizeBytes"],
  properties: {
    clientScreenshotId: { type: "string", minLength: 1 },
    capturedAt: { type: "string", format: "date-time" },
    originalFileName: { type: "string", minLength: 1 },
    mimeType: { type: "string", enum: ["image/png", "image/jpeg", "image/webp"] },
    sha256: { type: "string", pattern: "^[a-fA-F0-9]{64}$" },
    sizeBytes: { type: "integer", minimum: 1 },
    width: { type: "integer", minimum: 1 }, height: { type: "integer", minimum: 1 },
  },
};
const successResponse = { type: "object", required: ["success", "data"], properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } };

export const registerScreenshotsRoutes = async (fastify, { screenshotsService, authenticateRequest }) => {
  const controller = createScreenshotsController({ screenshotsService });
  fastify.post("/screenshots", {
    onRequest: authenticateRequest,
    attachValidation: true,
    schema: {
      tags: ["Screenshots"], summary: "Upload one screenshot directly", description: "Accepts one multipart screenshot file up to 25 MiB and a capturedAt timestamp.",
      security: [{ bearerAuth: [] }],
      consumes: ["multipart/form-data"],
      body: { type: "object", required: ["screenshot", "capturedAt"], properties: { screenshot: { type: "string", format: "binary" }, capturedAt: { type: "string" } } },
      response: { 201: successResponse, 400: errorSchema, 401: errorSchema, 403: errorSchema, 413: errorSchema, 503: errorSchema },
    },
  }, controller.createDirect);

  fastify.post("/screenshot-batches/uploads", {
    preHandler: authenticateRequest,
    attachValidation: true,
    schema: {
      tags: ["Screenshots"], summary: "Create a signed screenshot batch upload session",
      description: "Creates durable metadata and signed upload parameters. If this organization has no Cloudinary configuration, the batch is deferred and no rows are created.",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object", additionalProperties: false, required: ["batchId", "deviceId", "screenshots"],
        properties: {
          batchId: { type: "string", minLength: 1 }, deviceId: { type: "string", minLength: 1 },
          screenshots: { type: "array", minItems: 1, maxItems: 100, items: screenshotItem },
        },
      },
      response: { 201: successResponse, 400: errorSchema, 401: errorSchema, 403: errorSchema, 409: errorSchema, 503: errorSchema },
    },
  }, controller.createUploadSession);

  fastify.post("/screenshot-batches/:batchId/complete", {
    preHandler: authenticateRequest,
    attachValidation: true,
    schema: {
      tags: ["Screenshots"], summary: "Verify and complete a screenshot batch",
      description: "Verifies provider assets against server-owned screenshot rows and acknowledges the submitted clientScreenshotIds only after the transaction commits.",
      security: [{ bearerAuth: [] }],
      params: { type: "object", required: ["batchId"], properties: { batchId: { type: "string", minLength: 1 } } },
      body: {
        type: "object", additionalProperties: false, required: ["deviceId"],
        properties: {
          deviceId: { type: "string", minLength: 1 },
          uploaded: { type: "array", default: [], items: { type: "object", required: ["clientScreenshotId", "cloudinaryPublicId", "cloudinaryUrl"], properties: { clientScreenshotId: { type: "string", minLength: 1 }, cloudinaryPublicId: { type: "string", minLength: 1 }, cloudinaryUrl: { type: "string", format: "uri" }, cloudinaryAssetId: { type: ["string", "null"] }, cloudinaryVersion: { type: "integer" }, cloudinaryFormat: { type: ["string", "null"] }, sizeBytes: { type: "integer", minimum: 1 } } } },
          duplicates: { type: "array", default: [], items: { type: "object", required: ["clientScreenshotId", "duplicateOf"], properties: { clientScreenshotId: { type: "string", minLength: 1 }, duplicateOf: { type: "string", minLength: 1 } } } },
        },
      },
      response: { 200: successResponse, 400: errorSchema, 401: errorSchema, 404: errorSchema, 409: errorSchema, 503: errorSchema },
    },
  }, controller.completeUploadSession);
};
