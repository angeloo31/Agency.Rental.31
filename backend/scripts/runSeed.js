import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../models/Vehicle.js';
import Category from '../models/Category.js';
import ExtraOption from '../models/ExtraOption.js';
import SiteSettings from '../models/SiteSettings.js';

dotenv.config();

const MOCK_VEHICLES = [
  {
    "make": "Tesla",
    "model": "Model 3",
    "year": 2023,
    "pricePerDay": 15000,
    "category": "Car",
    "subcategory": "Luxury Sedan",
    "securityDeposit": 50000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779835657/luxerent/myodq4pxw14ufksvnafy.jpg"
    ],
    "features": {
      "doors": 4,
      "transmission": "Automatic",
      "fuel": "Electric"
    }
  },
  {
    "make": "Porsche",
    "model": "911 Carrera",
    "year": 2024,
    "pricePerDay": 35000,
    "category": "Car",
    "subcategory": "Wedding Vehicles",
    "securityDeposit": 150000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779835679/luxerent/fltajytlsk1nbzplfcte.jpg"
    ],
    "features": {
      "doors": 2,
      "transmission": "Automatic",
      "fuel": "Petrol"
    }
  },
  {
    "make": "Ferrari",
    "model": "F8 Tributo",
    "year": 2023,
    "pricePerDay": 85000,
    "category": "Car",
    "subcategory": "Sports & Supercar",
    "securityDeposit": 250000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779835659/luxerent/lulvlhob7hh4mcgylsfc.jpg"
    ],
    "features": {
      "doors": 2,
      "transmission": "Automatic",
      "fuel": "Petrol"
    }
  },
  {
    "make": "Mercedes-Benz",
    "model": "G 63 AMG",
    "year": 2024,
    "pricePerDay": 50000,
    "category": "Car",
    "subcategory": "Wedding Vehicles",
    "securityDeposit": 150000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779835680/luxerent/p6bg2ge4fcsbruuwqdia.jpg"
    ],
    "features": {
      "doors": 5,
      "transmission": "Automatic",
      "fuel": "Petrol"
    }
  },
  {
    "make": "BMW",
    "model": "M5 Competition",
    "year": 2023,
    "pricePerDay": 28000,
    "category": "Car",
    "subcategory": "Luxury Sedan",
    "securityDeposit": 80000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779835660/luxerent/fzaboxf53vjlgsoimuld.jpg"
    ],
    "features": {
      "doors": 4,
      "transmission": "Automatic",
      "fuel": "Petrol"
    }
  },
  {
    "make": "Ducati",
    "model": "Panigale V4",
    "year": 2022,
    "pricePerDay": 20000,
    "category": "Motorcycle",
    "subcategory": "Sportbike",
    "securityDeposit": 60000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779835661/luxerent/uizertcpbrscn0jx2bmf.jpg"
    ],
    "features": {
      "cc": 1103,
      "helmet_included": true
    }
  },
  {
    "make": "Kawasaki",
    "model": "Ninja H2",
    "year": 2023,
    "pricePerDay": 25000,
    "category": "Motorcycle",
    "subcategory": "Sportbike",
    "securityDeposit": 60000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779835661/luxerent/qe7wc3l8a6zic4zu584d.jpg"
    ],
    "features": {
      "cc": 998,
      "helmet_included": true
    }
  },
  {
    "make": "Yamaha",
    "model": "WaveRunner EX",
    "year": 2024,
    "pricePerHour": 8000,
    "category": "JetSki",
    "subcategory": "Sport & Performance",
    "securityDeposit": 30000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779835681/luxerent/zfd0slu3nxbgmqcxf1d7.jpg"
    ],
    "features": {
      "horsepower": 100,
      "life_jackets_included": true
    }
  },
  {
    "make": "Sea-Doo",
    "model": "RXT-X 300",
    "year": 2024,
    "pricePerHour": 11000,
    "category": "JetSki",
    "subcategory": "Sport & Performance",
    "securityDeposit": 40000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779835663/luxerent/deme2fys9p97colsmqdf.jpg"
    ],
    "features": {
      "horsepower": 300,
      "life_jackets_included": true
    }
  },
  {
    "make": "Renault",
    "model": "Symbol",
    "year": 2022,
    "pricePerDay": 5000,
    "category": "Car",
    "subcategory": "Economic / Compact",
    "securityDeposit": 20000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779842955/luxerent/tdnpflepqf3qdjxpzi5m.jpg"
    ],
    "features": {
      "doors": 4,
      "transmission": "Manual",
      "fuel": "Petrol"
    }
  },
  {
    "make": "Dacia",
    "model": "Sandero Stepway",
    "year": 2023,
    "pricePerDay": 7000,
    "category": "Car",
    "subcategory": "Economic / Compact",
    "securityDeposit": 20000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779842956/luxerent/ofperroklqrglafogznn.jpg"
    ],
    "features": {
      "doors": 4,
      "transmission": "Manual",
      "fuel": "Petrol"
    }
  },
  {
    "make": "Volkswagen",
    "model": "Golf 8 R-Line",
    "year": 2023,
    "pricePerDay": 18000,
    "category": "Car",
    "subcategory": "Economic / Compact",
    "securityDeposit": 40000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779842957/luxerent/eo7gufsmq9av0tgqyt3t.jpg"
    ],
    "features": {
      "doors": 4,
      "transmission": "Automatic",
      "fuel": "Diesel"
    }
  },
  {
    "make": "Seat",
    "model": "Ibiza",
    "year": 2022,
    "pricePerDay": 6500,
    "category": "Car",
    "subcategory": "Economic / Compact",
    "securityDeposit": 25000,
    "cautionOptional": true,
    "status": "Available",
    "images": [
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779842957/luxerent/nncc8sxbzznyndo04oyi.jpg"
    ],
    "features": {
      "doors": 4,
      "transmission": "Manual",
      "fuel": "Petrol"
    }
  }
];

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
