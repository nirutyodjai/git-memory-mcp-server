import Fastify from 'fastify';
import { Server } from 'socket.io';
import cors from '@fastify/cors';
import collaborationRoutes from './routes/collaboration';
import rootRoutes from './routes/index';
import fileRoutes from './routes/files';
import terminalRoutes from './routes/terminal';
import aiRoutes from './routes/ai';

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
});

const io = new Server(server.server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
});

server.decorate('io', io);

server.register(rootRoutes);
server.register(fileRoutes);
server.register(terminalRoutes, { prefix: '/terminals' });
server.register(aiRoutes, { prefix: '/ai' });
server.register(collaborationRoutes);

const start = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();