import redisClient from '../../config/redis.js';

export const socketRateLimiter = (maxRequests = 100, windowMs = 60000) => {
  return async (socket, next) => {
    const key = `ratelimit:${socket.id}`;
    
    try {
      const current = await redisClient.incr(key);
      
      if (current === 1) {
        await redisClient.expire(key, Math.ceil(windowMs / 1000));
      }
      
      if (current > maxRequests) {
        return next(new Error('Rate limit exceeded'));
      }
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next(); // Allow on error to prevent blocking
    }
  };
};

// Connection limiter per IP
export const connectionLimiter = async (socket, next) => {
  const ip = socket.handshake.address;
  const key = `connections:${ip}`;
  
  try {
    const connections = await redisClient.incr(key);
    
    if (connections === 1) {
      await redisClient.expire(key, 3600); // 1 hour
    }
    
    const maxConnections = 10; // Max 10 connections per IP
    if (connections > maxConnections) {
      return next(new Error('Too many connections from this IP'));
    }
    
    next();
  } catch (error) {
    next();
  }
};