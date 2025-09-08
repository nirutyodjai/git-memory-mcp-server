import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.post('/terminals', async (request: FastifyRequest, reply: FastifyReply) => {
    // This will eventually create a new terminal session.
    return { message: 'Terminal created' };
  });
}