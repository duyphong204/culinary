import mediasoupServer from './index.js';
import { mediasoupConfig } from '../config/mediasoup.js';

/**
 * WebRTC Room Management
 * Quản lý producers, consumers, transports trong một room
 */
class WebRTCRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.router = null;
    this.producers = new Map(); // producerId -> Producer
    this.consumers = new Map(); // consumerId -> Consumer
    this.transports = new Map(); // transportId -> Transport
    this.streamerTransport = null; // Transport của streamer
    this.streamerProducer = null; // Producer của streamer
  }

  async initialize() {
    this.router = await mediasoupServer.createRouter(this.roomId);
    return this;
  }

  // Create WebRTC transport
  async createTransport(socketId, isStreamer = false) {
    const router = this.router;
    if (!router) {
      throw new Error('Router not initialized');
    }

    const transport = await router.createWebRtcTransport({
      listenIps: mediasoupConfig.webRtcTransport.listenIps,
      enableUdp: mediasoupConfig.webRtcTransport.enableUdp,
      enableTcp: mediasoupConfig.webRtcTransport.enableTcp,
      preferUdp: mediasoupConfig.webRtcTransport.preferUdp,
      initialAvailableOutgoingBitrate: mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
    });

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') {
        transport.close();
      }
    });

    transport.on('close', () => {
      console.log(`Transport closed: ${transport.id}`);
    });

    this.transports.set(transport.id, transport);
    mediasoupServer.addTransport(this.roomId, transport.id, transport);

    if (isStreamer) {
      this.streamerTransport = transport;
    }

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
    };
  }

  // Connect transport
  async connectTransport(transportId, dtlsParameters) {
    const transport = this.transports.get(transportId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    await transport.connect({ dtlsParameters });
  }

  // Create producer (streamer sends video)
  async createProducer(transportId, rtpParameters, kind) {
    const transport = this.transports.get(transportId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    // Enable simulcast nếu là video
    if (kind === 'video' && mediasoupConfig.simulcast.enabled) {
      await producer.enableSimulcast(mediasoupConfig.simulcast.layers);
    }

    this.producers.set(producer.id, producer);
    mediasoupServer.addProducer(this.roomId, producer.id, producer);

    if (transportId === this.streamerTransport?.id) {
      this.streamerProducer = producer;
    }

    producer.on('transportclose', () => {
      producer.close();
      this.producers.delete(producer.id);
    });

    return {
      id: producer.id,
      kind: producer.kind,
      rtpParameters: producer.rtpParameters,
    };
  }

  // Create consumer (viewer receives video)
  async createConsumer(transportId, producerId, rtpCapabilities) {
    const transport = this.transports.get(transportId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    const producer = this.producers.get(producerId);
    if (!producer) {
      throw new Error('Producer not found');
    }

    // Check if router can consume this producer
    if (!this.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error('Cannot consume this producer');
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false,
    });

    this.consumers.set(consumer.id, consumer);
    mediasoupServer.addConsumer(this.roomId, consumer.id, consumer);

    consumer.on('transportclose', () => {
      consumer.close();
      this.consumers.delete(consumer.id);
    });

    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  // Pause/Resume consumer
  async pauseConsumer(consumerId) {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) {
      throw new Error('Consumer not found');
    }
    await consumer.pause();
  }

  async resumeConsumer(consumerId) {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) {
      throw new Error('Consumer not found');
    }
    await consumer.resume();
  }

  // Close transport
  async closeTransport(transportId) {
    const transport = this.transports.get(transportId);
    if (transport) {
      transport.close();
      this.transports.delete(transportId);
    }
  }

  // Get room info
  getInfo() {
    return {
      roomId: this.roomId,
      routerId: this.router.id,
      producersCount: this.producers.size,
      consumersCount: this.consumers.size,
      transportsCount: this.transports.size,
      hasStreamer: !!this.streamerProducer,
    };
  }

  // Cleanup
  async cleanup() {
    // Close all transports
    for (const transport of this.transports.values()) {
      transport.close();
    }

    // Producers and consumers will be closed automatically when transports close
    this.producers.clear();
    this.consumers.clear();
    this.transports.clear();
    this.streamerTransport = null;
    this.streamerProducer = null;
  }
}

// Room manager
const rooms = new Map(); // roomId -> WebRTCRoom

export const getOrCreateRoom = async (roomId) => {
  if (!rooms.has(roomId)) {
    const room = new WebRTCRoom(roomId);
    await room.initialize();
    rooms.set(roomId, room);
  }
  return rooms.get(roomId);
};

export const getRoom = (roomId) => {
  return rooms.get(roomId);
};

export const deleteRoom = async (roomId) => {
  const room = rooms.get(roomId);
  if (room) {
    await room.cleanup();
    rooms.delete(roomId);
    await mediasoupServer.deleteRoom(roomId);
  }
};

export default WebRTCRoom;

