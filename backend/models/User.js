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
    enum: ['Admin', 'Seller', 'Agent', 'Customer'], 
    default: 'Seller',
    required: true
  },
  permissions: {
    type: [String],
    default: function() {
      if (this.role === 'Admin') {
        return [
          'manage_users', 'manage_settings', 'manage_fleet',
          'manage_bookings', 'view_analytics', 'manage_categories',
          'manage_extra_options', 'seed_db'
        ];
      }
      if (this.role === 'Seller' || this.role === 'Agent') {
        return [
          'manage_bookings', 'create_booking', 'view_fleet',
          'view_analytics', 'manage_extra_options', 'manage_categories'
        ];
      }
      return [];
    }
  },
  email: {
    type: String,
    default: process.env.SMTP_USER || 'yahiakrr@gmail.com',
    trim: true,
    lowercase: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  otpCode: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
