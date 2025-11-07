/**
 * Livestream Socket Events Constants
 * Tất cả các events cho livestream functionality
 */

export const LIVESTREAM_EVENTS = {
    
    // Stream Management
    JOIN_STREAM: 'join-stream',
    LEAVE_STREAM: 'leave-stream',
    START_STREAM: 'start-stream',
    STOP_STREAM: 'stop-stream',
    PAUSE_STREAM: 'pause-stream',
    RESUME_STREAM: 'resume-stream',
    
    // WebRTC Signaling
    SEND_SIGNAL: 'signal',
    OFFER: 'offer',
    ANSWER: 'answer',
    ICE_CANDIDATE: 'ice-candidate',
    
    // Quality Control
    REQUEST_QUALITY_CHANGE: 'request-quality-change',
    QUALITY_CHANGE: 'quality-change',
    
    // Stream Info
    REQUEST_STREAM_INFO: 'request-stream-info',
    REQUEST_VIEWER_COUNT: 'request-viewer-count',
    
    // ========== Server -> Client Events ==========
    
    // Stream Status
    STREAM_STARTED: 'stream-started',
    STREAM_STOPPED: 'stream-stopped',
    STREAM_PAUSED: 'stream-paused',
    STREAM_RESUMED: 'stream-resumed',
    STREAM_STATUS: 'stream-status',
    
    // Viewer Management
    USER_JOINED: 'user-joined',
    USER_LEFT: 'user-left',
    VIEWER_COUNT: 'viewer-count',
    VIEWER_LIST: 'viewer-list',
    
    // WebRTC Signaling Response
    SIGNAL_RECEIVED: 'signal-received',
    
    // Quality Updates
    QUALITY_UPDATED: 'quality-updated',
    QUALITY_CHANGE_FAILED: 'quality-change-failed',
    
    // Stream Info Response
    STREAM_INFO: 'stream-info',
    
    // Errors
    ERROR: 'stream-error',
    WARNING: 'stream-warning',
    
    // Notifications
    NOTIFICATION: 'stream-notification',
    
    // ========== Chat Events (nếu có chat trong livestream) ==========
    SEND_MESSAGE: 'send-message',
    MESSAGE_RECEIVED: 'message-received',
    MESSAGE_DELETED: 'message-deleted',
    
    // ========== Interaction Events ==========
    LIKE_STREAM: 'like-stream',
    UNLIKE_STREAM: 'unlike-stream',
    SHARE_STREAM: 'share-stream',
    
    // ========== Admin/Moderator Events ==========
    BAN_USER: 'ban-user',
    UNBAN_USER: 'unban-user',
    MUTE_USER: 'mute-user',
    UNMUTE_USER: 'unmute-user',
  };
  
  // Event categories để dễ quản lý
  export const EVENT_CATEGORIES = {
    STREAM_CONTROL: [
      LIVESTREAM_EVENTS.START_STREAM,
      LIVESTREAM_EVENTS.STOP_STREAM,
      LIVESTREAM_EVENTS.PAUSE_STREAM,
      LIVESTREAM_EVENTS.RESUME_STREAM,
    ],
    VIEWER_ACTIONS: [
      LIVESTREAM_EVENTS.JOIN_STREAM,
      LIVESTREAM_EVENTS.LEAVE_STREAM,
    ],
    WEBRTC: [
      LIVESTREAM_EVENTS.SEND_SIGNAL,
      LIVESTREAM_EVENTS.OFFER,
      LIVESTREAM_EVENTS.ANSWER,
      LIVESTREAM_EVENTS.ICE_CANDIDATE,
    ],
    QUALITY: [
      LIVESTREAM_EVENTS.REQUEST_QUALITY_CHANGE,
      LIVESTREAM_EVENTS.QUALITY_CHANGE,
    ],
  };
  
  // Error codes
  export const ERROR_CODES = {
    MISSING_ROOM_ID: 'MISSING_ROOM_ID',
    STREAM_NOT_FOUND: 'STREAM_NOT_FOUND',
    STREAM_NOT_ACTIVE: 'STREAM_NOT_ACTIVE',
    ROOM_FULL: 'ROOM_FULL',
    JOIN_FAILED: 'JOIN_FAILED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    CONNECTION_LIMIT: 'CONNECTION_LIMIT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    QUALITY_CHANGE_FAILED: 'QUALITY_CHANGE_FAILED',
    INVALID_QUALITY: 'INVALID_QUALITY',
  };
  
  export default LIVESTREAM_EVENTS;