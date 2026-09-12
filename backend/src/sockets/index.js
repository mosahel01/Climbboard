import { verifyToken } from '../services/auth.service.js';

export const roomName = (gameId) => `lb:${gameId}`;

export function setupSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.sub;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId || null;
    console.log(`[socket] connected ${socket.id}${userId ? ` (user ${userId})` : ' (guest)'}`);

    socket.on('leaderboard:join', (gameId) => {
      if (typeof gameId !== 'string') return;
      socket.join(roomName(gameId));
    });

    socket.on('leaderboard:leave', (gameId) => {
      if (typeof gameId !== 'string') return;
      socket.leave(roomName(gameId));
    });

    socket.on('disconnect', (reason) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[socket] disconnected ${socket.id} (${reason})`);
      }
    });
  });

  return io;
}