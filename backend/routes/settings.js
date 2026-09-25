import express from 'express';
import SiteSettings from '../models/SiteSettings.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { deleteCloudinaryImage } from '../config/cloudinary.js';

const router = express.Router();

// Helper to ensure at least one settings doc exists
const getSettingsDoc = async () => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({
      storeName: "LuxeRent",
      storeLogo: "",
      phone: "+213 (0) 550 12 34 56",
      email: "contact@luxerent.com",
      address: "Alger, Algérie",
      mainColors: { primary: "#4f46e5" },
      hero: {
        title: {
          fr: "Le frisson de la location premium",
          en: "The thrill of premium rental",
          ar: "متعة التأجير الفاخر"
        },
        subtitle: {
          fr: "Faites votre choix parmi notre flotte exclusive de voitures, motos et jet-skis. Payez facilement sur place à la récupération de votre véhicule.",
          en: "Choose from our exclusive fleet of cars, motorcycles and jet-skis. Pay easily on site upon pickup.",
          ar: "اختر من أسطولنا الحصري من السيارات، الدراجات النارية والجات سكي. ادفع بسهولة عند استلام مركبتك."
        },
        backgroundImage: ""
      },
      showDateSearch: true,
      showSearchWidget: true,
      locations: [
        { name: "Aéroport d'Alger - Houari Boumédiène", type: "Airport", categories: ["Car", "Motorcycle"] },
        { name: "Aéroport d'Oran - Ahmed Ben Bella", type: "Airport", categories: ["Car", "Motorcycle"] },
        { name: "Agence Centrale (Alger Centre)", type: "City", categories: ["Car", "Motorcycle"] },
        { name: "Sidi Fredj Marina (Alger)", type: "Marina", categories: ["JetSki"] },
        { name: "Les Andalouses Beach (Oran)", type: "Marina", categories: ["JetSki"] }
      ]
    });
  }
  return settings;
};

// ── GET /api/settings ─────────────────────────────────────────────────────────
// Public endpoint to fetch site settings (locations, hero text)
router.get('/', async (req, res) => {
  try {
    const settings = await getSettingsDoc();
    res.json(settings);
  } catch (error) {
    console.error('[Settings] GET error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve site settings.' });
  }
});

// ── PATCH /api/settings ───────────────────────────────────────────────────────
// Protected admin endpoint to update site settings
router.patch('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const settingsDoc = await getSettingsDoc();
    
    // Check replaced image URLs for Cloudinary cleanup
    const oldLogo = settingsDoc.storeLogo;
    const newLogo = req.body.storeLogo;
    if (oldLogo && newLogo && oldLogo !== newLogo) {
      deleteCloudinaryImage(oldLogo).catch(err => console.error('[Settings Logo Cleanup] Error:', err.message));
    }

    const oldHeroBg = settingsDoc.hero?.backgroundImage;
    const newHeroBg = req.body.hero?.backgroundImage;
    if (oldHeroBg && newHeroBg && oldHeroBg !== newHeroBg) {
      deleteCloudinaryImage(oldHeroBg).catch(err => console.error('[Settings Hero Cleanup] Error:', err.message));
    }

    const oldAboutImg = settingsDoc.aboutStoryImage;
    const newAboutImg = req.body.aboutStoryImage;
    if (oldAboutImg && newAboutImg && oldAboutImg !== newAboutImg) {
      deleteCloudinaryImage(oldAboutImg).catch(err => console.error('[Settings About Cleanup] Error:', err.message));
    }

    // We expect the full new settings object in req.body
    const updatedSettings = await SiteSettings.findByIdAndUpdate(
      settingsDoc._id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json(updatedSettings);
  } catch (error) {
    console.error('[Settings] PATCH error:', error.message);
    res.status(500).json({ error: 'Failed to update site settings.' });
  }
});

export default router;
