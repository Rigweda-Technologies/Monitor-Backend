import { createCloudinaryController } from "./cloudinary.controller.js";

const errorSchema = {
  type: "object",
  required: ["success", "message"],
  properties: { success: { type: "boolean", const: false }, message: { type: "string" }, errorCode: { type: "string" } },
};
const authenticationErrorSchema = { type: "object", required: ["success", "message"], properties: { success: { type: "boolean" }, message: { type: "string" } } };

export const registerCloudinaryRoutes = async (fastify, { cloudinaryService, authenticateRequest }) => {
  const controller = createCloudinaryController({ cloudinaryService });
  fastify.get("/cloudinary/upload-config", {
    preHandler: authenticateRequest,
    schema: {
      tags: ["Cloudinary"],
      summary: "Get public Cloudinary upload settings for the authenticated organization",
      description: "Returns only the Cloudinary cloud name, API key and upload flags; the API secret remains server-side.",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          required: ["success", "data"],
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              required: ["cloudName", "apiKey", "uploadFolderRoot", "screenshotsEnabled", "mouseEnabled", "keyboardEnabled", "updatedAt"],
              properties: {
                cloudName: { type: "string" },
                apiKey: { type: "string" },
                uploadFolderRoot: { type: "string" },
                screenshotsEnabled: { type: "boolean" },
                mouseEnabled: { type: "boolean" },
                keyboardEnabled: { type: "boolean" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
        401: authenticationErrorSchema,
        403: errorSchema,
        404: { type: "object", required: ["success", "message"], properties: { success: { type: "boolean" }, message: { type: "string" } } },
        503: errorSchema,
      },
    },
  }, controller.getUploadConfig);
};
