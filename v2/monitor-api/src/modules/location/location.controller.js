export const createLocationController = ({ locationService }) => ({
  receiveReport: async (request, reply) => {
    const result = await locationService.receiveReport({ auth: request.auth, report: request.body });
    return reply.code(200).send(result);
  },
});
