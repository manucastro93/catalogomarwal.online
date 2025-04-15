import { Server } from 'socket.io';

export const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', socket => {
    console.log('🔌 Cliente conectado');

    socket.on('disconnect', () => {
      console.log('❌ Cliente desconectado');
    });
  });

  return io;
};
