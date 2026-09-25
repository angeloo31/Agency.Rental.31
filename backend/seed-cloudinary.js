import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Load environment variables FIRST before importing other dependencies
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import Vehicle from './models/Vehicle.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary using the environment variable
if (process.env.CLOUDINARY_URL) {
  const match = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    const [, apiKey, apiSecret, cloudName] = match;
    console.log('Manually configuring Cloudinary with cloud_name:', cloudName);
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
  } else {
    console.warn('Could not parse CLOUDINARY_URL format, attempting standard config...');
    cloudinary.config();
  }
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set in environment variables.');
  process.exit(1);
}

// Updated MOCK_VEHICLES: Using already uploaded Cloudinary URLs for successfully migrated ones,
// and fresh working Unsplash URLs for the previously broken ones (Porsche, Mercedes, Yamaha).
const MOCK_VEHICLES = [
  {
    "make": "Tesla",
    "model": "Model 3",
    "year": 2023,
    "pricePerDay": 15000,
    "category": "Car",
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
    "status": "Available",
    "images": [
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop"
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
    "status": "Available",
    "images": [
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=80&w=1000&auto=format&fit=crop"
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
    "status": "Available",
    "images": [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1000&auto=format&fit=crop"
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
    "status": "Available",
    "images": [
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1000&auto=format&fit=crop"
    ],
    "features": {
      "doors": 4,
      "transmission": "Manual",
      "fuel": "Petrol"
    }
  }
];

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const updatedVehicles = [];

    for (const vehicle of MOCK_VEHICLES) {
      console.log(`Processing ${vehicle.make} ${vehicle.model}...`);
      const cloudinaryImages = [];

      for (const imgUrl of vehicle.images) {
        if (imgUrl.includes('res.cloudinary.com')) {
          console.log(`Image already on Cloudinary: ${imgUrl}`);
          cloudinaryImages.push(imgUrl);
          continue;
        }

        try {
          console.log(`Uploading to Cloudinary: ${imgUrl}`);
          const res = await cloudinary.uploader.upload(imgUrl, {
            folder: 'luxerent',
          });
          console.log(`Successfully uploaded: ${res.secure_url}`);
          cloudinaryImages.push(res.secure_url);
        } catch (uploadError) {
          console.error(`Failed to upload ${imgUrl}:`, uploadError.message);
          // Fallback to original URL if upload fails
          cloudinaryImages.push(imgUrl);
        }
      }

      updatedVehicles.push({
        ...vehicle,
        images: cloudinaryImages
      });
    }

    console.log('\nAll images uploaded! Updating database...');
    await Vehicle.deleteMany({});
    const inserted = await Vehicle.insertMany(updatedVehicles);
    console.log(`Successfully updated database with ${inserted.length} vehicles.`);

    // Now update seed.js file content dynamically
    console.log('\nUpdating seed.js source file...');
    const seedFilePath = path.join(__dirname, 'routes', 'seed.js');
    let seedContent = fs.readFileSync(seedFilePath, 'utf8');

    // Build the new MOCK_VEHICLES string to replace in the seed file
    const newMockVehiclesStr = JSON.stringify(updatedVehicles, null, 2);
    
    const startIdx = seedContent.indexOf('const MOCK_VEHICLES = [');
    const endIdx = seedContent.indexOf('];', startIdx);

    if (startIdx !== -1 && endIdx !== -1) {
      const targetStr = seedContent.substring(startIdx, endIdx + 2);
      const replacementStr = `const MOCK_VEHICLES = ${newMockVehiclesStr};`;
      seedContent = seedContent.replace(targetStr, replacementStr);
      fs.writeFileSync(seedFilePath, seedContent, 'utf8');
      console.log('seed.js successfully updated.');
    } else {
      console.warn('Could not locate MOCK_VEHICLES in seed.js to update the file source.');
    }

    console.log('\nMigration and database update complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  }
}

main();
