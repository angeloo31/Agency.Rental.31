import express from 'express';
import mongoose from 'mongoose';
import ExtraOption from '../models/ExtraOption.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all extra options (Public, needed for checkout)
router.get('/', async (req, res) => {
  try {
    const options = await ExtraOption.find().populate('vehicleId', 'make model');
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new extra option (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const newOption = new ExtraOption(req.body);
    const savedOption = await newOption.save();
    res.status(201).json(savedOption);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update an extra option (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Option ID format.' });
    }
    const updatedOption = await ExtraOption.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedOption);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH toggle status (Admin only)
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Option ID format.' });
    }
    const option = await ExtraOption.findById(req.params.id);
    if (!option) return res.status(404).json({ error: 'Option not found' });
    option.isActive = req.body.isActive;
    await option.save();
    res.json(option);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE an extra option (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Option ID format.' });
    }
    await ExtraOption.findByIdAndDelete(req.params.id);
    res.json({ message: 'Option deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
