import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import { requireAuth } from '../middleware/auth.js';
import { deleteCloudinaryImage } from '../config/cloudinary.js';

const router = express.Router();

// Define standard 13 realistic catalog items for the Algerian community
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
      "https://res.cloudinary.com/davrl8ifp/image/upload/v1779835681/luxerent/zfd0slug3nxbgmqcxf1d7.jpg"
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

// POST /seed - Resets database catalog and populates the 13 realistic Algerian vehicles
router.post('/seed', async (req, res) => {
  try {
    await Vehicle.deleteMany({});
    const vehicles = await Vehicle.insertMany(MOCK_VEHICLES);
    res.json({ message: 'Catalog successfully seeded', count: vehicles.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET / - Retrieves all catalog entries with optional category filtering and date availability checking
router.get('/', async (req, res) => {
  try {
    const { category, pickupDate, returnDate } = req.query;
    let query = {};
    if (category && category !== 'All') {
      query.category = category;
    }

    if (pickupDate && returnDate) {
      const start = new Date(pickupDate);
      const end = new Date(returnDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end) {
        // 1. Find overlapping bookings that are confirmed or pending
        const overlappingBookings = await Booking.find({
          pickupDate: { $lt: end },
          returnDate: { $gt: start },
          bookingStatus: { $in: ['Pending', 'Confirmed'] }
        }, 'vehicleId').lean();

        const bookedVehicleIds = overlappingBookings.map(b => b.vehicleId);

        // 2. Exclude vehicles that are booked
        if (bookedVehicleIds.length > 0) {
          query._id = { $nin: bookedVehicleIds };
        }

        // 3. Exclude vehicles that have explicit unavailability dates overlapping this period
        query.unavailabilityDates = {
          $not: {
            $elemMatch: {
              start: { $lt: end },
              end: { $gt: start }
            }
          }
        };
      }
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id - Retrieves individual vehicle specifications by id
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - Creates a new vehicle record (Admin operations)
router.post('/', requireAuth, async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /:id - Modifies an existing vehicle entry (Admin operations)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const existingVehicle = await Vehicle.findById(req.params.id);
    if (!existingVehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Cleanup images removed during update
    const newImages = Array.isArray(req.body.images) ? req.body.images : [];
    const newLandingImage = req.body.landingImage || '';

    const oldImages = Array.isArray(existingVehicle.images) ? existingVehicle.images : [];
    const oldLandingImage = existingVehicle.landingImage || '';

    // Find images in old list that are no longer referenced in new images or landingImage
    const removedImages = oldImages.filter(img => img && !newImages.includes(img) && img !== newLandingImage);
    if (oldLandingImage && oldLandingImage !== newLandingImage && !newImages.includes(oldLandingImage)) {
      if (!removedImages.includes(oldLandingImage)) {
        removedImages.push(oldLandingImage);
      }
    }

    // Delete removed images from Cloudinary
    for (const imgUrl of removedImages) {
      deleteCloudinaryImage(imgUrl).catch(err => console.error('[Vehicle Update Cleanup] Error:', err.message));
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /:id - Removes a vehicle from catalog (Admin operations)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Gather all Cloudinary image URLs associated with this vehicle
    const imagesToDelete = [];
    if (Array.isArray(vehicle.images)) {
      imagesToDelete.push(...vehicle.images);
    }
    if (vehicle.landingImage && !imagesToDelete.includes(vehicle.landingImage)) {
      imagesToDelete.push(vehicle.landingImage);
    }

    // Delete all associated photos from Cloudinary
    for (const imgUrl of imagesToDelete) {
      deleteCloudinaryImage(imgUrl).catch(err => console.error('[Vehicle Delete Cleanup] Error:', err.message));
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
