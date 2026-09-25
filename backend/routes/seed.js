import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Category from '../models/Category.js';
import ExtraOption from '../models/ExtraOption.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    await Vehicle.deleteMany({});
    await Category.deleteMany({});
    await ExtraOption.deleteMany({});
    await Booking.deleteMany({});
    await Message.deleteMany({});

    res.json({ 
      message: 'Base de données réinitialisée avec succès.', 
      vehiclesCount: 0, 
      categoriesCount: 0,
      extraOptionsCount: 0 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
