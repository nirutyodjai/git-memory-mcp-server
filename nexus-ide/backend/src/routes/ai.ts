import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    // This will eventually handle chat requests to the AI Copilot.
    return { message: 'AI response' };
  });
}