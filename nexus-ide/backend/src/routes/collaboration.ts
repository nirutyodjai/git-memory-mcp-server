import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    io: any;
  }
}

// Store active users
const users: { [id: string]: { id: string; name: string; color: string } } = {};

// Function to generate a random color
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default async function collaborationRoutes(server: FastifyInstance) {
  server.ready(err => {
    if (err) throw err;

    server.io.on('connection', (socket: any) => {
      console.log('Client connected', socket.id);

      // Add new user
      users[socket.id] = {
        id: socket.id,
        name: `User-${socket.id.substring(0, 4)}`,
        color: getRandomColor(),
      };

      // Broadcast updated user list
      server.io.emit('users', Object.values(users));

      socket.on('get users', () => {
        socket.emit('users', Object.values(users));
      });

      socket.on('chat message', (message: { user: string; text: string }) => {
        console.log(`Received message: ${message.text}`);
        // Broadcast message to all clients
        server.io.emit('chat message', message);
      });

      socket.on('editor:change', (code: string) => {
        socket.broadcast.emit('editor:change', code);
      });

      socket.on('cursor:change', (position: { line: number; column: number }) => {
        socket.broadcast.emit('cursor:change', { userId: socket.id, position });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
        // Remove user
        delete users[socket.id];
        // Broadcast updated user list
        server.io.emit('users', Object.values(users));
      });
    });
  });
}