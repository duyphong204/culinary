import { LIVESTREAM_EVENTS } from '../events/livestream.events.js';
import { WEBRTC_EVENTS } from '../events/webrtc.events.js';
import roomManager from '../services/roomManager.js';
import StreamViewer from '../../models/StreamViewer.js';
import Livestream from '../../models/Livestream.js';
import { getOrCreateRoom, getRoom } from '../../webrtc/room.js';

export const setupLivestreamHandlers = (io, socket) => {
  // Join stream with optimizations
  socket.on(LIVESTREAM_EVENTS.JOIN_STREAM, async (data) => {
    try {
      const { roomId, quality = 'auto', language = 'vi' } = data;
      
      if (!roomId) {
        return socket.emit(LIVESTREAM_EVENTS.ERROR, { 
          message: 'Room ID is required',
          code: 'MISSING_ROOM_ID'
        });
      }

      // Check livestream exists and is active
      const livestream = await Livestream.findOne({ roomId, status: 'live' });
      if (!livestream) {
        return socket.emit(LIVESTREAM_EVENTS.ERROR, {
          message: 'Stream not found or not active',
          code: 'STREAM_NOT_FOUND'
        });
      }

      // Join room via Redis
      const result = await roomManager.joinRoom(roomId, socket.userId, socket.id);
      
      if (!result.success) {
        return socket.emit(LIVESTREAM_EVENTS.ERROR, {
          message: result.error,
          code: 'JOIN_FAILED'
        });
      }

      // Join socket room
      socket.join(roomId);
      
      // Initialize WebRTC room if not exists
      const webrtcRoom = await getOrCreateRoom(roomId);
      
      // Save viewer to DB (async, don't block)
      StreamViewer.create({
        livestreamId: livestream._id,
        userId: socket.userId,
        socketId: socket.id,
        roomId,
        quality,
        deviceInfo: socket.handshake.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
        country: socket.handshake.headers['cf-ipcountry'] || 'unknown',
      }).catch(err => console.error('Viewer save error:', err));

      // Notify others (only to room, not broadcast)
      socket.to(roomId).emit(LIVESTREAM_EVENTS.USER_JOINED, {
        userId: socket.userId,
        viewerCount: result.viewerCount,
      });

      // Send current state to new viewer with WebRTC info
      socket.emit(LIVESTREAM_EVENTS.STREAM_STATUS, {
        status: 'live',
        roomId,
        viewerCount: result.viewerCount,
        quality: livestream.quality,
        streamerId: livestream.streamerId,
        webrtcEnabled: true,
        // Send router RTP capabilities for WebRTC setup
        rtpCapabilities: webrtcRoom.router.rtpCapabilities,
      });

      // Update viewer count in DB (async)
      Livestream.updateOne(
        { _id: livestream._id },
        { 
          $set: { viewerCount: result.viewerCount },
          $max: { peakViewers: result.viewerCount }
        }
      ).catch(err => console.error('Viewer count update error:', err));

    } catch (error) {
      console.error('Join stream error:', error);
      socket.emit(LIVESTREAM_EVENTS.ERROR, {
        message: 'Failed to join stream',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // Leave stream
  socket.on(LIVESTREAM_EVENTS.LEAVE_STREAM, async (data) => {
    try {
      const { roomId } = data;
      socket.leave(roomId);
      
      const viewerCount = await roomManager.leaveRoom(roomId, socket.userId, socket.id);
      
      // Update viewer record
      await StreamViewer.findOneAndUpdate(
        { socketId: socket.id, roomId },
        { leftAt: new Date() }
      );

      // Notify room
      socket.to(roomId).emit(LIVESTREAM_EVENTS.USER_LEFT, {
        userId: socket.userId,
        viewerCount,
      });
    } catch (error) {
      console.error('Leave stream error:', error);
    }
  });

  // WebRTC signaling (optimized)
  socket.on(LIVESTREAM_EVENTS.SEND_SIGNAL, (data) => {
    const { to, signal, type } = data;
    // Only send to specific socket, not broadcast
    io.to(to).emit(LIVESTREAM_EVENTS.SEND_SIGNAL, {
      from: socket.id,
      signal,
      type,
      userId: socket.userId,
    });
  });

  // Start stream
  socket.on(LIVESTREAM_EVENTS.START_STREAM, async (data) => {
    try {
      const { roomId, locationId } = data;
      
      const livestream = await Livestream.findOne({ roomId, streamerId: socket.userId });
      if (!livestream) {
        return socket.emit(LIVESTREAM_EVENTS.ERROR, {
          message: 'Stream not found',
          code: 'STREAM_NOT_FOUND'
        });
      }

      // Create Redis room
      await roomManager.createRoom(roomId, socket.userId, livestream.maxViewers);
      
      // Initialize WebRTC room
      const webrtcRoom = await getOrCreateRoom(roomId);
      
      await Livestream.updateOne({ _id: livestream._id }, { 
        status: 'live',
        startTime: new Date()
      });

      socket.join(roomId);
      
      // Send WebRTC router capabilities to streamer
      socket.emit(WEBRTC_EVENTS.ROUTER_RTP_CAPABILITIES, {
        rtpCapabilities: webrtcRoom.router.rtpCapabilities,
      });
      
      io.to(roomId).emit(LIVESTREAM_EVENTS.STREAM_STARTED, {
        roomId,
        streamerId: socket.userId,
        webrtcEnabled: true,
      });
    } catch (error) {
      socket.emit(LIVESTREAM_EVENTS.ERROR, { message: error.message });
    }
  });

  // Stop stream
  socket.on(LIVESTREAM_EVENTS.STOP_STREAM, async (data) => {
    try {
      const { roomId } = data;
      await roomManager.endRoom(roomId);
      
      // Cleanup WebRTC room
      const webrtcRoom = getRoom(roomId);
      if (webrtcRoom) {
        await webrtcRoom.cleanup();
      }
      
      await Livestream.updateOne(
        { roomId, streamerId: socket.userId },
        { status: 'ended', endTime: new Date() }
      );

      io.to(roomId).emit(LIVESTREAM_EVENTS.STREAM_STOPPED, { roomId });
    } catch (error) {
      console.error('Stop stream error:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      // Get all rooms socket was in
      const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      
      for (const roomId of rooms) {
        const viewerCount = await roomManager.leaveRoom(roomId, socket.userId, socket.id);
        
        // Cleanup WebRTC transports for this socket
        const webrtcRoom = getRoom(roomId);
        if (webrtcRoom) {
          // Close all transports for this socket
          for (const [transportId, transport] of webrtcRoom.transports.entries()) {
            // Note: In real implementation, you'd track which transport belongs to which socket
            // For now, we'll let WebRTC handler manage this
          }
        }
        
        // Update viewer record
        await StreamViewer.findOneAndUpdate(
          { socketId: socket.id, roomId },
          { 
            leftAt: new Date(),
            $inc: { watchDuration: Math.floor((Date.now() - new Date()) / 1000) }
          }
        );

        // Notify room
        socket.to(roomId).emit(LIVESTREAM_EVENTS.USER_LEFT, {
          userId: socket.userId,
          viewerCount,
        });
      }
    } catch (error) {
      console.error('Disconnect cleanup error:', error);
    }
  });
};