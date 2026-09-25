import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  name_fr: { type: String, default: '' },
  name_ar: { type: String, default: '' },
  isVisible: { type: Boolean, default: true },
  subcategories: [{ type: String }],
  subcategories_fr: [{ type: String }],
  subcategories_ar: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);
