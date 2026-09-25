import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const defaultCategories = [
      { name: 'Car', isVisible: true, subcategories: ['Voiture de mariage', 'Familiale', 'Sport'] },
      { name: 'Motorcycle', isVisible: true, subcategories: ['Sportive', 'Cruiser', 'Scooter'] },
      { name: 'JetSki', isVisible: true, subcategories: ['Sport', 'Loisir'] }
    ];

    for (const cat of defaultCategories) {
      await Category.findOneAndUpdate({ name: cat.name }, cat, { upsert: true, new: true });
    }

    console.log('Categories seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories', error);
    process.exit(1);
  }
}

seed();
