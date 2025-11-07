import mongoose from 'mongoose';

const streamViewerSchema = new mongoose.Schema({
  livestreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestream',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  socketId: {
    type: String,
    required: true,
    index: true,
  },
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  leftAt: Date,
  watchDuration: {
    type: Number, // seconds
    default: 0,
  },
  // Quality & performance
  quality: {
    type: String,
    enum: ['low', 'medium', 'high', 'ultra'],
  },
  deviceInfo: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop'],
  },
  country: String, // ISO code
  connectionSpeed: String, // 'slow', 'medium', 'fast'
  // For analytics
  interactions: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

// TTL index - auto delete after 7 days
streamViewerSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

// Compound index
streamViewerSchema.index({ livestreamId: 1, userId: 1 });

export default mongoose.model('StreamViewer', streamViewerSchema);