/**
 * MediaSoup Configuration
 * Tối ưu cho livestream 1000+ users với SFU architecture
 */

import os from 'os';

export const mediasoupConfig = {
  // Worker settings - số lượng workers = số CPU cores
  numWorkers: process.env.MEDIASOUP_NUM_WORKERS 
    ? parseInt(process.env.MEDIASOUP_NUM_WORKERS) 
    : os.cpus().length,
  
  // Router settings - codecs hỗ trợ
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
        parameters: {
          minptime: 10,
          useinbandfec: true,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/VP9',
        clockRate: 90000,
        parameters: {
          'profile-id': 2,
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '42e01f',
          'level-asymmetry-allowed': 1,
        },
      },
    ],
  },

  // WebRTC transport settings
  webRtcTransport: {
    listenIps: [
      {
        ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || null, // Public IP nếu có
      },
    ],
    initialAvailableOutgoingBitrate: 1000000, // 1 Mbps
    minimumAvailableOutgoingBitrate: 600000,  // 600 Kbps
    maxSctpMessageSize: 262144,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  },

  // Bitrate settings cho các quality levels
  bitrate: {
    low: 500000,      // 500 Kbps
    medium: 1500000,  // 1.5 Mbps
    high: 3000000,    // 3 Mbps
    ultra: 5000000,   // 5 Mbps
  },

  // Simulcast settings (gửi nhiều quality cùng lúc)
  simulcast: {
    enabled: true,
    layers: [
      { rid: 'low', scaleResolutionDownBy: 4, maxBitrate: 500000 },
      { rid: 'medium', scaleResolutionDownBy: 2, maxBitrate: 1500000 },
      { rid: 'high', scaleResolutionDownBy: 1, maxBitrate: 3000000 },
    ],
  },
};

export default mediasoupConfig;

