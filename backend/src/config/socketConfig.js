import { createAdapter } from '@socket.io/redis-adapter';
import { redisPublisher, redisSubscriber } from './redis.js';

export const socketConfig = {
  cors: {
    origin: process.env.CLIENT_URL?.split(',') || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
    transports: ['websocket'], 
    allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    threshold: 1024,
  },
};

export const setupRedisAdapter = (io) => {
  io.adapter(createAdapter(redisPublisher, redisSubscriber));
  console.log('✅ Socket.io Redis adapter configured');
};