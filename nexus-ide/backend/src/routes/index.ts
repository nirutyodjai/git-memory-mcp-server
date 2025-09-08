import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return { message: 'Welcome to NEXUS IDE Backend' };
  });
}