import express from 'express';
import Category from '../models/Category.js';

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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
  try {
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
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
