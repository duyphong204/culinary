import mediasoup from 'mediasoup';
import { mediasoupConfig } from '../config/mediasoup.js';

/**
 * MediaSoup Server - SFU (Selective Forwarding Unit)
 * Hỗ trợ scale lên 1000+ users
 */
class MediaSoupServer {
  constructor() {
    this.workers = [];
    this.nextWorkerIndex = 0;
    this.rooms = new Map(); // roomId -> { router, producers, consumers }
  }

  async initialize() {
    console.log('🚀 Initializing MediaSoup server...');
    
    const numWorkers = mediasoupConfig.numWorkers;
    
    // Create workers
    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
        rtcMinPort: 40000 + (i * 1000),
        rtcMaxPort: 49999 - (i * 1000),
      });

      worker.on('died', () => {
        console.error(`❌ MediaSoup worker ${i} died, exiting in 2 seconds...`);
        setTimeout(() => process.exit(1), 2000);
      });

      this.workers.push(worker);
      console.log(`✅ MediaSoup worker ${i + 1}/${numWorkers} created (PID: ${worker.pid})`);
    }

    console.log(`✅ MediaSoup initialized with ${numWorkers} workers`);
    return this;
  }

  // Get next worker (round-robin load balancing)
  getNextWorker() {
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  // Create router for a room
  async createRouter(roomId) {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId).router;
    }

    const worker = this.getNextWorker();
    const router = await worker.createRouter({
      mediaCodecs: mediasoupConfig.router.mediaCodecs,
    });

    this.rooms.set(roomId, {
      router,
      producers: new Map(), // producerId -> Producer
      consumers: new Map(), // consumerId -> Consumer
      transports: new Map(), // transportId -> Transport
    });

    console.log(`✅ Router created for room: ${roomId}`);
    
    return router;
  }

  // Get room data
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  // Get router for room
  getRouter(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.router : null;
  }

  // Add producer to room
  addProducer(roomId, producerId, producer) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.producers.set(producerId, producer);
    }
  }

  // Add consumer to room
  addConsumer(roomId, consumerId, consumer) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.consumers.set(consumerId, consumer);
    }
  }

  // Add transport to room
  addTransport(roomId, transportId, transport) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.transports.set(transportId, transport);
    }
  }

  // Get all producers in room
  getProducers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.producers.values()) : [];
  }

  // Delete router and cleanup
  async deleteRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Close all transports
    for (const transport of room.transports.values()) {
      transport.close();
    }

    // Close all producers
    for (const producer of room.producers.values()) {
      producer.close();
    }

    // Close all consumers
    for (const consumer of room.consumers.values()) {
      consumer.close();
    }

    this.rooms.delete(roomId);
    console.log(`🗑️  Room deleted: ${roomId}`);
  }

  // Get stats
  getStats() {
    return {
      workers: this.workers.length,
      rooms: this.rooms.size,
      totalProducers: Array.from(this.rooms.values())
        .reduce((sum, room) => sum + room.producers.size, 0),
      totalConsumers: Array.from(this.rooms.values())
        .reduce((sum, room) => sum + room.consumers.size, 0),
    };
  }
}

export default new MediaSoupServer();

