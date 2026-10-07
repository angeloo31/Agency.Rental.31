import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../models/Vehicle.js';
import Category from '../models/Category.js';
import ExtraOption from '../models/ExtraOption.js';
import SiteSettings from '../models/SiteSettings.js';
import { MOCK_VEHICLES } from '../data/mockVehicles.js';

dotenv.config();

const PRELIMINARY_EXTRA_OPTIONS = [
  {
    name: 'Child Safety Seat',
    name_fr: 'Siège Enfant de Sécurité',
    name_ar: 'مقعد أمان للأطفال',
    price: 1500,
    priceType: 'per_day',
    isActive: true,
    applicableTo: 'Category',
    category: 'Car'
  },
  {
    name: 'Additional Driver',
    name_fr: 'Conducteur Supplémentaire',
    name_ar: 'سائق إضافي',
    price: 2000,
    priceType: 'flat_rate',
    isActive: true,
    applicableTo: 'All'
  },
  {
    name: 'GPS Navigation System',
    name_fr: 'Système de Navigation GPS',
    name_ar: 'نظام الملاحة GPS',
    price: 1000,
    priceType: 'per_day',
    isActive: true,
    applicableTo: 'Category',
    category: 'Car'
  },
  {
    name: 'Full Insurance Coverage',
    name_fr: 'Assurance Tous Risques (Zéro Franchise)',
    name_ar: 'تأمين شامل (بدون نسبة تحمل)',
    price: 3000,
    priceType: 'per_day',
    isActive: true,
    applicableTo: 'All'
  },
  {
    name: 'Wi-Fi 4G Hotspot',
    name_fr: 'Routeur Wi-Fi 4G Haut Débit',
    name_ar: 'راوتر وايفاي 4G عالي السرعة',
    price: 800,
    priceType: 'per_day',
    isActive: true,
    applicableTo: 'Category',
    category: 'Car'
  },
  {
    name: 'GoPro Action Cam',
    name_fr: "Caméra d'Action 4K GoPro",
    name_ar: 'كاميرا جوبرو 4K للمغامرات',
    price: 2500,
    priceType: 'per_day',
    isActive: true,
    applicableTo: 'All'
  },
  {
    name: 'Helmet & Gear Set',
    name_fr: 'Casque Homologué & Gants de Protection',
    name_ar: 'خوذة معتمدة وطقم قفازات حماية',
    price: 1000,
    priceType: 'flat_rate',
    isActive: true,
    applicableTo: 'Category',
    category: 'Motorcycle'
  },
  {
    name: 'Wetsuit & Life Vest Set',
    name_fr: 'Combinaison Néoprène & Gilet de Sauvetage',
    name_ar: 'بدلة غوص وجاكيت نجاة معتمد',
    price: 1500,
    priceType: 'flat_rate',
    isActive: true,
    applicableTo: 'Category',
    category: 'JetSki'
  }
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Vehicle.deleteMany({});
    const vehicles = await Vehicle.insertMany(MOCK_VEHICLES);

    await Category.deleteMany({});
    const categories = await Category.insertMany([
      { 
        name: 'Car', 
        name_fr: 'Voiture',
        name_ar: 'سيارة',
        isVisible: true, 
        subcategories: ['Wedding Vehicles', 'Luxury Sedan', 'SUV & 4x4', 'Sports & Supercar', 'Economic / Compact', 'Convertible'],
        subcategories_fr: ['Véhicules de Mariage', 'Berline de Luxe', 'SUV & 4x4', 'Sport & Supercar', 'Économique / Compacte', 'Cabriolet'],
        subcategories_ar: ['سيارات الأعراس', 'سيدان فاخرة', 'دفع رباعي و SUV', 'سيارات رياضية وخارقة', 'اقتصادية / مدمجة', 'كابريوليه / مكشوفة']
      },
      { 
        name: 'Motorcycle', 
        name_fr: 'Moto',
        name_ar: 'دراجة نارية',
        isVisible: true, 
        subcategories: ['Sportbike', 'Cruiser', 'Scooter', 'Adventure'],
        subcategories_fr: ['Sportive', 'Routière / Cruiser', 'Scooter', 'Aventure'],
        subcategories_ar: ['دراجة رياضية', 'كروزر / جوالة', 'سكوتر', 'مغامرة']
      },
      { 
        name: 'JetSki', 
        name_fr: 'Jet Ski',
        name_ar: 'جيت سكي',
        isVisible: true, 
        subcategories: ['Sport & Performance', 'Recreation', 'Luxury Touring'],
        subcategories_fr: ['Sport & Performance', 'Loisir', 'Grand Tourisme'],
        subcategories_ar: ['رياضة وأداء', 'ترفيه', 'سياحة فاخرة']
      }
    ]);

    await ExtraOption.deleteMany({});
    const options = await ExtraOption.insertMany(PRELIMINARY_EXTRA_OPTIONS);

    await SiteSettings.deleteMany({});
    const settings = await SiteSettings.create({
      storeName: 'DZ Location',
      phone: '+213 (0) 550 00 00 00',
      email: 'contact@dzlocation.com',
      address: 'Alger, Algérie'
    });

    console.log('Seed SUCCESSFUL!');
    console.log(`Vehicles: ${vehicles.length}, Categories: ${categories.length}, ExtraOptions: ${options.length}, StoreName: ${settings.storeName}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
}

main();
