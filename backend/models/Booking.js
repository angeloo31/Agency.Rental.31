import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestPhone: { type: String, required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  pickupDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  pickupLocation: { type: String, required: true },
  addOns: [{ type: String }],
  rentalType: { type: String, enum: ['hour', 'halfDay', 'day'], default: 'day' },
  withDriver: { type: Boolean, default: false },
  includeCaution: { type: Boolean, default: false },
  cautionAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['Pay On-Site'], 
    default: 'Pay On-Site' 
  },
  bookingStatus: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  }
}, { timestamps: true });

BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ vehicleId: 1 });
BookingSchema.index({ guestEmail: 1 });

export default mongoose.model('Booking', BookingSchema);
