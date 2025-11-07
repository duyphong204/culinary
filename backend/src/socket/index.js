import { Server } from 'socket.io';
import { socketConfig, setupRedisAdapter } from '../config/socketConfig.js';
import { socketAuth } from './middleware/socketAuth.js';
import { socketRateLimiter, connectionLimiter } from './middleware/rateLimiter.js';
import { setupLivestreamHandlers } from './handlers/livestream.handler.js';
import { setupWebRTCHandlers } from './handlers/webrtc.handler.js';

export const initializeSocket = (server) => {
  const io = new Server(server, socketConfig);
  
  // Setup Redis adapter for multi-server scaling
  setupRedisAdapter(io);

  // Livestream namespace
  const livestreamNamespace = io.of('/livestream');
  
  // Apply middleware
  livestreamNamespace.use(connectionLimiter);
  livestreamNamespace.use(socketAuth);
  livestreamNamespace.use(socketRateLimiter(100, 60000)); // 100 requests per minute

  livestreamNamespace.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.id})`);
    
    // Setup both livestream and WebRTC handlers
    setupLivestreamHandlers(livestreamNamespace, socket);
    setupWebRTCHandlers(livestreamNamespace, socket);
  });

  // Performance monitoring
  setInterval(() => {
    const sockets = livestreamNamespace.sockets;
    console.log(`📊 Active connections: ${sockets.size}`);
  }, 60000); // Every minute

  return io;
};