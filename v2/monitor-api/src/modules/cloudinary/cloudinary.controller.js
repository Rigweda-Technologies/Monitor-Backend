export const createCloudinaryController = ({ cloudinaryService }) => ({
  getUploadConfig: async (request, reply) => {
    const data = await cloudinaryService.getPublicUploadConfig({ organizationId: request.auth.organizationId });
    if (!data) return reply.code(404).send({ success: false, message: "Cloudinary settings are not configured yet." });
    return reply.send({ success: true, data });
  },
});
