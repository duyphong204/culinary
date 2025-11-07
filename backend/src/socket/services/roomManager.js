import redisClient from '../../config/redis.js';

class RoomManager {
  constructor() {
    this.ROOM_PREFIX = 'room:';
    this.VIEWER_PREFIX = 'viewers:';
    this.STREAMER_PREFIX = 'streamer:';
  }

  async createRoom(roomId, streamerId, maxViewers = 1000) {
    const roomKey = `${this.ROOM_PREFIX}${roomId}`;
    const streamerKey = `${this.STREAMER_PREFIX}${roomId}`;
    
    await Promise.all([
      redisClient.hset(roomKey, {
        streamerId,
        status: 'active',
        maxViewers,
        createdAt: Date.now(),
      }),
      redisClient.set(streamerKey, streamerId),
      redisClient.expire(roomKey, 86400), 
      redisClient.expire(streamerKey, 86400),
    ]);
  }

  async joinRoom(roomId, userId, socketId) {
    const viewerKey = `${this.VIEWER_PREFIX}${roomId}`;
    const roomKey = `${this.ROOM_PREFIX}${roomId}`;
    
    const exists = await redisClient.exists(roomKey);
    if (!exists) {
      return { success: false, error: 'Room not found' };
    }

    const room = await redisClient.hgetall(roomKey);
    const currentViewers = await redisClient.scard(viewerKey);
    
    if (currentViewers >= parseInt(room.maxViewers || 1000)) {
      return { success: false, error: 'Room is full' };
    }

    await redisClient.sadd(viewerKey, `${userId}:${socketId}`);
    await redisClient.expire(viewerKey, 86400);

    return { 
      success: true, 
      viewerCount: currentViewers + 1,
      room 
    };
  }

  // Leave room
  async leaveRoom(roomId, userId, socketId) {
    const viewerKey = `${this.VIEWER_PREFIX}${roomId}`;
    await redisClient.srem(viewerKey, `${userId}:${socketId}`);
    
    const viewerCount = await redisClient.scard(viewerKey);
    return viewerCount;
  }

  // Get viewer count (fast Redis operation)
  async getViewerCount(roomId) {
    const viewerKey = `${this.VIEWER_PREFIX}${roomId}`;
    return await redisClient.scard(viewerKey);
  }

  // Get room info
  async getRoom(roomId) {
    const roomKey = `${this.ROOM_PREFIX}${roomId}`;
    const room = await redisClient.hgetall(roomKey);
    if (!room || !room.streamerId) return null;
    
    const viewerCount = await this.getViewerCount(roomId);
    return { ...room, viewerCount: parseInt(viewerCount) };
  }

  // End room
  async endRoom(roomId) {
    const roomKey = `${this.ROOM_PREFIX}${roomId}`;
    const viewerKey = `${this.VIEWER_PREFIX}${roomId}`;
    const streamerKey = `${this.STREAMER_PREFIX}${roomId}`;
    
    await Promise.all([
      redisClient.hset(roomKey, 'status', 'ended'),
      redisClient.del(viewerKey),
      redisClient.del(streamerKey),
    ]);
  }

  // Get all active rooms (for monitoring)
  async getActiveRooms() {
    const keys = await redisClient.keys(`${this.ROOM_PREFIX}*`);
    const rooms = [];
    
    for (const key of keys) {
      const room = await redisClient.hgetall(key);
      if (room.status === 'active') {
        const roomId = key.replace(this.ROOM_PREFIX, '');
        rooms.push({
          roomId,
          ...room,
          viewerCount: await this.getViewerCount(roomId),
        });
      }
    }
    
    return rooms;
  }
}

export default new RoomManager();