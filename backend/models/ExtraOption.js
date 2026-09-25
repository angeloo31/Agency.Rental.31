import mongoose from 'mongoose';

const ExtraOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_fr: { type: String, default: '' },
  name_ar: { type: String, default: '' },
  price: { type: Number, default: 0 },
  priceType: { type: String, enum: ['per_day', 'flat_rate'], default: 'flat_rate' },
  isActive: { type: Boolean, default: true },
  
  // Binding rules
  applicableTo: { type: String, enum: ['All', 'Category', 'Vehicle'], default: 'All' },
  category: { type: String, enum: ['Car', 'Motorcycle', 'JetSki'] },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }
}, { timestamps: true });

export default mongoose.model('ExtraOption', ExtraOptionSchema);
