export const createCloudinaryRepository = ({ prisma }) => ({
  findByOrganizationId: (organizationId) => prisma.monitorCloudinarySetting.findUnique({ where: { organizationId } }),
});
