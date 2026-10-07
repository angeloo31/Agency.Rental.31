import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Category from '../models/Category.js';
import ExtraOption from '../models/ExtraOption.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';
import { MOCK_VEHICLES } from '../data/mockVehicles.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Vehicle.deleteMany({});
    await Category.deleteMany({});
    await ExtraOption.deleteMany({});
    await Booking.deleteMany({});
    await Message.deleteMany({});

    // Seed standard vehicle catalog
    const insertedVehicles = await Vehicle.insertMany(MOCK_VEHICLES);

    // Seed default categories from vehicles
    const categoryNames = [...new Set(MOCK_VEHICLES.map(v => v.category).filter(Boolean))];
    const insertedCategories = await Category.insertMany(
      categoryNames.map(name => ({ name, description: `Catégorie ${name}` }))
    );

    res.json({ 
      message: 'Base de données réinitialisée et rechargée avec succès.', 
      vehiclesCount: insertedVehicles.length, 
      categoriesCount: insertedCategories.length,
      extraOptionsCount: 0 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
