import { WEBRTC_EVENTS, WEBRTC_ERROR_CODES } from '../events/webrtc.events.js';
import { getOrCreateRoom, getRoom } from '../../webrtc/room.js';
import mediasoupServer from '../../webrtc/index.js';

/**
 * WebRTC Signaling Handlers
 * Xử lý tất cả WebRTC signaling events
 */
export const setupWebRTCHandlers = (io, socket) => {
  // Get router RTP capabilities
  socket.on(WEBRTC_EVENTS.ROUTER_RTP_CAPABILITIES, async (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        return socket.emit(WEBRTC_EVENTS.ERROR, {
          code: WEBRTC_ERROR_CODES.ROOM_NOT_FOUND,
          message: 'Room ID is required',
        });
      }

      const room = await getOrCreateRoom(roomId);
      const rtpCapabilities = room.router.rtpCapabilities;

      socket.emit(WEBRTC_EVENTS.ROUTER_RTP_CAPABILITIES, {
        rtpCapabilities,
      });
    } catch (error) {
      console.error('Router RTP capabilities error:', error);
      socket.emit(WEBRTC_EVENTS.ERROR, {
        code: WEBRTC_ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
      });
    }
  });

  // Create WebRTC transport
  socket.on(WEBRTC_EVENTS.CREATE_TRANSPORT, async (data) => {
    try {
      const { roomId, isStreamer = false } = data;

      if (!roomId) {
        return socket.emit(WEBRTC_EVENTS.ERROR, {
          code: WEBRTC_ERROR_CODES.ROOM_NOT_FOUND,
          message: 'Room ID is required',
        });
      }

      const room = await getOrCreateRoom(roomId);
      const transportParams = await room.createTransport(socket.id, isStreamer);

      socket.emit(WEBRTC_EVENTS.TRANSPORT_CREATED, {
        transportId: transportParams.id,
        iceParameters: transportParams.iceParameters,
        iceCandidates: transportParams.iceCandidates,
        dtlsParameters: transportParams.dtlsParameters,
      });
    } catch (error) {
      console.error('Create transport error:', error);
      socket.emit(WEBRTC_EVENTS.ERROR, {
        code: WEBRTC_ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
      });
    }
  });

  // Connect transport
  socket.on(WEBRTC_EVENTS.CONNECT_TRANSPORT, async (data) => {
    try {
      const { roomId, transportId, dtlsParameters } = data;

      if (!roomId || !transportId || !dtlsParameters) {
        return socket.emit(WEBRTC_EVENTS.ERROR, {
          code: WEBRTC_ERROR_CODES.INVALID_RTP_CAPABILITIES,
          message: 'Missing required parameters',
        });
      }

      const room = getRoom(roomId);
      if (!room) {
        return socket.emit(WEBRTC_EVENTS.ERROR, {
          code: WEBRTC_ERROR_CODES.ROOM_NOT_FOUND,
          message: 'Room not found',
        });
      }

      await room.connectTransport(transportId, dtlsParameters);

      socket.emit(WEBRTC_EVENTS.TRANSPORT_CONNECTED, {
        transportId,
      });
    } catch (error) {
      console.error('Connect transport error:', error);
      socket.emit(WEBRTC_EVENTS.ERROR, {
        code: WEBRTC_ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
      });
    }
  });

  // Produce (Streamer sends video/audio)
  socket.on(WEBRTC_EVENTS.PRODUCE, async (data) => {
    try {
      const { roomId, transportId, kind, rtpParameters } = data;

      if (!roomId || !transportId || !kind || !rtpParameters) {
        return socket.emit(WEBRTC_EVENTS.ERROR, {
          code: WEBRTC_ERROR_CODES.INVALID_RTP_CAPABILITIES,
          message: 'Missing required parameters',
        });
      }

      const room = getRoom(roomId);
      if (!room) {
        return socket.emit(WEBRTC_EVENTS.ERROR, {
          code: WEBRTC_ERROR_CODES.ROOM_NOT_FOUND,
          message: 'Room not found',
        });
      }

      const producer = await room.createProducer(transportId, rtpParameters, kind);

      socket.emit(WEBRTC_EVENTS.PRODUCER_CREATED, {
        producerId: producer.id,
        kind: producer.kind,
      });

      // Notify all viewers in room about new producer
      socket.to(roomId).emit(WEBRTC_EVENTS.NEW_PRODUCER, {
        producerId: producer.id,
        kind: producer.kind,
      });
    } catch (error) {
      console.error('Produce error:', error);
      socket.emit(WEBRTC_EVENTS.ERROR, {
        code: WEBRTC_ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
      });
    }
  });

  // Consume (Viewer receives video/audio)
  socket.on(WEBRTC_EVENTS.CONSUME, async (data) => {
    try {
      const { roomId, transportId, producerId, rtpCapabilities } = data;

      if (!roomId || !transportId || !producerId || !rtpCapabilities) {
        return socket.emit(WEBRTC_EVENTS.ERROR, {
          code: WEBRTC_ERROR_CODES.INVALID_RTP_CAPABILITIES,
          message: 'Missing required parameters',
        });
      }

      const room = getRoom(roomId);
      if (!room) {
        return socket.emit(WEBRTC_EVENTS.ERROR, {
          code: WEBRTC_ERROR_CODES.ROOM_NOT_FOUND,
          message: 'Room not found',
        });
      }

      const consumer = await room.createConsumer(transportId, producerId, rtpCapabilities);

      socket.emit(WEBRTC_EVENTS.CONSUMER_CREATED, {
        consumerId: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    } catch (error) {
      console.error('Consume error:', error);
      socket.emit(WEBRTC_EVENTS.ERROR, {
        code: error.message.includes('Cannot consume') 
          ? WEBRTC_ERROR_CODES.CANNOT_CONSUME 
          : WEBRTC_ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
      });
    }
  });

  // Resume consumer
  socket.on(WEBRTC_EVENTS.RESUME_CONSUMER, async (data) => {
    try {
      const { roomId, consumerId } = data;
      const room = getRoom(roomId);
      
      if (!room) {
        return socket.emit(WEBRTC_EVENTS.ERROR, {
          code: WEBRTC_ERROR_CODES.ROOM_NOT_FOUND,
          message: 'Room not found',
        });
      }

      await room.resumeConsumer(consumerId);
      socket.emit(WEBRTC_EVENTS.CONSUMER_RESUMED, { consumerId });
    } catch (error) {
      console.error('Resume consumer error:', error);
      socket.emit(WEBRTC_EVENTS.ERROR, {
        code: WEBRTC_ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
      });
    }
  });

  // Pause consumer
  socket.on(WEBRTC_EVENTS.PAUSE_CONSUMER, async (data) => {
    try {
      const { roomId, consumerId } = data;
      const room = getRoom(roomId);
      
      if (!room) {
        return socket.emit(WEBRTC_EVENTS.ERROR, {
          code: WEBRTC_ERROR_CODES.ROOM_NOT_FOUND,
          message: 'Room not found',
        });
      }

      await room.pauseConsumer(consumerId);
      socket.emit(WEBRTC_EVENTS.CONSUMER_PAUSED, { consumerId });
    } catch (error) {
      console.error('Pause consumer error:', error);
      socket.emit(WEBRTC_EVENTS.ERROR, {
        code: WEBRTC_ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
      });
    }
  });

  // Handle ICE candidates
  socket.on(WEBRTC_EVENTS.PRODUCER_ICE_CANDIDATE, async (data) => {
    try {
      const { roomId, transportId, candidate } = data;
      const room = getRoom(roomId);
      
      if (!room) return;

      const transport = room.transports.get(transportId);
      if (transport) {
        await transport.setRemoteIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Producer ICE candidate error:', error);
    }
  });

  socket.on(WEBRTC_EVENTS.CONSUMER_ICE_CANDIDATE, async (data) => {
    try {
      const { roomId, transportId, candidate } = data;
      const room = getRoom(roomId);
      
      if (!room) return;

      const transport = room.transports.get(transportId);
      if (transport) {
        await transport.setRemoteIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Consumer ICE candidate error:', error);
    }
  });

  // Close transport
  socket.on(WEBRTC_EVENTS.CLOSE_TRANSPORT, async (data) => {
    try {
      const { roomId, transportId } = data;
      const room = getRoom(roomId);
      
      if (room) {
        await room.closeTransport(transportId);
      }
    } catch (error) {
      console.error('Close transport error:', error);
    }
  });

  // Handle disconnect - cleanup
  socket.on('disconnect', async () => {
    try {
      // Cleanup sẽ được xử lý trong livestream handler
      console.log(`WebRTC cleanup for socket: ${socket.id}`);
    } catch (error) {
      console.error('Disconnect cleanup error:', error);
    }
  });
};

