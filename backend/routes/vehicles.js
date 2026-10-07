import express from 'express';
import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import { requireAuth, requireAdmin, requirePermission } from '../middleware/auth.js';
import { deleteCloudinaryImage } from '../config/cloudinary.js';
import { MOCK_VEHICLES } from '../data/mockVehicles.js';

const router = express.Router();

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Format d\'identifiant de véhicule invalide.' });
    }
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - Creates a new vehicle record (Admin & Seller permissions)
router.post('/', requireAuth, requirePermission('manage_fleet'), async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /:id - Modifies an existing vehicle entry (Admin & Seller permissions)
router.put('/:id', requireAuth, requirePermission('manage_fleet'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Format d\'identifiant de véhicule invalide.' });
    }
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
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Format d\'identifiant de véhicule invalide.' });
    }
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
