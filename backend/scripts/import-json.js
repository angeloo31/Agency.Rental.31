import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import Vehicle from '../models/Vehicle.js';
import Category from '../models/Category.js';
import ExtraOption from '../models/ExtraOption.js';
import SiteSettings from '../models/SiteSettings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not defined in environment variables.');
  process.exit(1);
}

// Find JSON file path (either argument, backend/data/import_data.json, or root import_data.json)
const customFile = process.argv[2];
let jsonFilePath = customFile ? path.resolve(customFile) : path.join(__dirname, '../data/import_data.json');
if (!fs.existsSync(jsonFilePath)) {
  jsonFilePath = path.join(__dirname, '../../import_data.json');
}

if (!fs.existsSync(jsonFilePath)) {
  console.error(`ERROR: JSON file not found at path: ${jsonFilePath}`);
  console.log('Please place import_data.json in backend/data/ or project root.');
  process.exit(1);
}

async function importData() {
  try {
    console.log(`Reading JSON file: ${jsonFilePath}`);
    const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
    const data = JSON.parse(rawData);

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    // 1. Import Site Settings
    if (data.settings) {
      console.log('Importing Site Settings...');
      await SiteSettings.deleteMany({});
      await SiteSettings.create(data.settings);
      console.log('✓ Site Settings imported.');
    }

    // 2. Import Categories
    if (Array.isArray(data.categories) && data.categories.length > 0) {
      console.log(`Importing ${data.categories.length} Categories...`);
      await Category.deleteMany({});
      await Category.insertMany(data.categories);
      console.log('✓ Categories imported.');
    }

    // 3. Import Extra Options
    if (Array.isArray(data.extraOptions) && data.extraOptions.length > 0) {
      console.log(`Importing ${data.extraOptions.length} Extra Options...`);
      await ExtraOption.deleteMany({});
      await ExtraOption.insertMany(data.extraOptions);
      console.log('✓ Extra Options imported.');
    }

    // 4. Import Vehicles
    if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
      console.log(`Importing ${data.vehicles.length} Vehicles...`);
      await Vehicle.deleteMany({});
      await Vehicle.insertMany(data.vehicles);
      console.log('✓ Vehicles imported.');
    }

    console.log('\n🎉 ALL DATA IMPORTED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ IMPORT FAILED:', error.message);
    process.exit(1);
  }
}

importData();
