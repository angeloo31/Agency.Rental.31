import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Agent'], 
    default: 'Agent',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
