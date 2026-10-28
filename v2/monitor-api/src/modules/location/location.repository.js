import { lockAndAssertDeviceOwner } from "../device-ownership/device-ownership.repository.js";

export const createLocationRepository = ({ prisma }) => ({
  async assertDeviceOwner(identity) {
    return prisma.$transaction((transaction) => lockAndAssertDeviceOwner({ transaction, ...identity }));
  },
});
