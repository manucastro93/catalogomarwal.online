import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const initSocket = () => {
  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
};

export const getSocket = () => socket;
