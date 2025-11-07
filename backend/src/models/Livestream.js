import mongoose from 'mongoose';

const livestreamSchema = new mongoose.Schema({
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
    index: true,
  },
  streamerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: Map,
    of: String, 
  },
  description: {
    type: Map,
    of: String,
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled',
    index: true,
  },
  startTime: {
    type: Date,
    index: true,
  },
  endTime: Date,
  viewerCount: {
    type: Number,
    default: 0,
    index: true,
  },
  peakViewers: {
    type: Number,
    default: 0,
  },
  maxViewers: {
    type: Number,
    default: 1000,
  },
  // CDN & Streaming config
  cdnUrl: String,
  streamKey: {
    type: String,
    unique: true,
  },
  quality: {
    type: String,
    enum: ['auto', 'low', 'medium', 'high', 'ultra'],
    default: 'auto',
  },
  bitrate: {
    low: Number,   
    medium: Number, 
    high: Number,  
    ultra: Number,  
  },
  thumbnail: String,
  tags: [String],
  language: {
    type: String,
    default: 'vi',
    enum: ['vi', 'en', 'zh', 'ja', 'ko'],
  },
  avgLatency: Number,
  packetLoss: Number,
  allowedCountries: [String], 
  blockedCountries: [String],
}, {
  timestamps: true,
});

livestreamSchema.index({ status: 1, startTime: -1 });
livestreamSchema.index({ locationId: 1, status: 1 });
livestreamSchema.index({ streamerId: 1, status: 1 });

export default mongoose.model('Livestream', livestreamSchema);