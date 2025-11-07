import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  recognizedDish: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
      hashedPassword: {
      type: String,
      required: true,
    },
    profilePic: { type: String, default: '' },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },

    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],

    uploads: [uploadSchema],

    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },

    onlineStatus: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline',
    },

    lastActiveAt: { type: Date },
    is_ban: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

export default mongoose.model('User', userSchema);
