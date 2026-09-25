import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Unread', 'Read'],
    default: 'Unread',
  },
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
