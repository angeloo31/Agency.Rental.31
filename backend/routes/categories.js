import express from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET visible categories
router.get('/visible', async (req, res) => {
  try {
    const categories = await Category.find({ isVisible: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new category
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, name_fr, name_ar, isVisible, subcategories, subcategories_fr, subcategories_ar } = req.body;
    const newCategory = new Category({ name, name_fr, name_ar, isVisible, subcategories, subcategories_fr, subcategories_ar });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update category
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Format d\'identifiant de catégorie invalide.' });
    }
    const { name, name_fr, name_ar, isVisible, subcategories, subcategories_fr, subcategories_ar } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, name_fr, name_ar, isVisible, subcategories, subcategories_fr, subcategories_ar },
      { new: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE category
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Format d\'identifiant de catégorie invalide.' });
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
