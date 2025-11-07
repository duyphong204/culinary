import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    role_id: { type: Number, required: true, unique: true },
    name: {
      type: String,
      enum: ['user', 'chef', 'staff', 'admin'],
      required: true,
    },
    description: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

export default mongoose.model('Role', roleSchema);
