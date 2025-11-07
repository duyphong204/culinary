/**
 * WebRTC Socket Events Constants
 * Events cho WebRTC signaling
 */

export const WEBRTC_EVENTS = {
  // ========== Client -> Server Events ==========
  
  // Transport
  CREATE_TRANSPORT: 'webrtc-create-transport',
  CONNECT_TRANSPORT: 'webrtc-connect-transport',
  
  // Producer (Streamer)
  PRODUCE: 'webrtc-produce',
  CLOSE_PRODUCER: 'webrtc-close-producer',
  
  // Consumer (Viewer)
  CONSUME: 'webrtc-consume',
  RESUME_CONSUMER: 'webrtc-resume-consumer',
  PAUSE_CONSUMER: 'webrtc-pause-consumer',
  CLOSE_CONSUMER: 'webrtc-close-consumer',
  
  // ICE Candidates
  PRODUCER_ICE_CANDIDATE: 'webrtc-producer-ice-candidate',
  CONSUMER_ICE_CANDIDATE: 'webrtc-consumer-ice-candidate',
  
  // Transport close
  CLOSE_TRANSPORT: 'webrtc-close-transport',
  
  // ========== Server -> Client Events ==========
  
  // Transport created
  TRANSPORT_CREATED: 'webrtc-transport-created',
  TRANSPORT_CONNECTED: 'webrtc-transport-connected',
  
  // Producer created
  PRODUCER_CREATED: 'webrtc-producer-created',
  PRODUCER_CLOSED: 'webrtc-producer-closed',
  
  // Consumer created
  CONSUMER_CREATED: 'webrtc-consumer-created',
  CONSUMER_PAUSED: 'webrtc-consumer-paused',
  CONSUMER_RESUMED: 'webrtc-consumer-resumed',
  CONSUMER_CLOSED: 'webrtc-consumer-closed',
  
  // New producer available (for viewers)
  NEW_PRODUCER: 'webrtc-new-producer',
  PRODUCER_CLOSED_NOTIFICATION: 'webrtc-producer-closed-notification',
  
  // ICE Candidates
  PRODUCER_ICE_CANDIDATE_RECEIVED: 'webrtc-producer-ice-candidate-received',
  CONSUMER_ICE_CANDIDATE_RECEIVED: 'webrtc-consumer-ice-candidate-received',
  
  // Errors
  ERROR: 'webrtc-error',
  
  // Router capabilities
  ROUTER_RTP_CAPABILITIES: 'webrtc-router-rtp-capabilities',
};

export const WEBRTC_ERROR_CODES = {
  TRANSPORT_NOT_FOUND: 'TRANSPORT_NOT_FOUND',
  PRODUCER_NOT_FOUND: 'PRODUCER_NOT_FOUND',
  CONSUMER_NOT_FOUND: 'CONSUMER_NOT_FOUND',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  CANNOT_CONSUME: 'CANNOT_CONSUME',
  INVALID_RTP_CAPABILITIES: 'INVALID_RTP_CAPABILITIES',
  TRANSPORT_CLOSED: 'TRANSPORT_CLOSED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export default WEBRTC_EVENTS;

