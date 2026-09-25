import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  pricePerHour: { type: Number },
  pricePerHalfDay: { type: Number },
  pricePerDay: { type: Number },
  discount: {
    percentage: { type: Number, default: 0 },
    label: { type: String, default: '' }
  },
  images: [{ type: String }],
  status: { 
    type: String, 
    enum: ['Available', 'Rented', 'Maintenance'], 
    default: 'Available' 
  },
  description: { type: String, default: '' },
  description_fr: { type: String, default: '' },
  description_ar: { type: String, default: '' },
  requirements: { type: String, default: '' },
  requirements_fr: { type: String, default: '' },
  requirements_ar: { type: String, default: '' },
  conditions: { type: String, default: '' },
  conditions_fr: { type: String, default: '' },
  conditions_ar: { type: String, default: '' },
  securityDeposit: { type: Number },
  cautionOptional: { type: Boolean, default: true },
  driverOption: {
    available: { type: Boolean, default: false },
    pricePerDay: { type: Number, default: 0 }
  },
  landingImage: { type: String, default: '' },
  unavailabilityDates: [{
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  }],
  category: { 
    type: String, 
    enum: ['Car', 'Motorcycle', 'JetSki'], 
    required: true 
  },
  subcategory: { type: String, default: '' },
  features: {
    doors: Number,
    transmission: { type: String, enum: ['Manual', 'Automatic'] },
    fuel: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'] },
    cc: Number,
    helmet_included: Boolean,
    horsepower: Number,
    life_jackets_included: Boolean
  }
}, { timestamps: true });

VehicleSchema.index({ category: 1, createdAt: -1 });
VehicleSchema.index({ createdAt: -1 });

export default mongoose.model('Vehicle', VehicleSchema);
