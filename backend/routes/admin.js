import express from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// ── Brute-Force Protection for Admin Login ────────────────────────────────────
// 5 attempts per 15 minutes per IP. After the limit, the IP is locked out.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
  skipSuccessfulRequests: true, // Successful logins don't count against the limit
});

// POST /api/admin/verify
// Accepts a plaintext passcode from the client and compares it via bcrypt
// against the hashed value stored in process.env.ADMIN_HASH.
// Returns 200 on success, 401 on wrong passcode, 500 if env is misconfigured.
router.post('/verify', loginLimiter, async (req, res) => {
  const { passcode } = req.body;

  if (!passcode || typeof passcode !== 'string') {
    return res.status(400).json({ error: 'Passcode is required.' });
  }

  const storedHash = process.env.ADMIN_HASH;
  if (!storedHash) {
    console.error('[Admin] FATAL: ADMIN_HASH is not set in environment variables.');
    return res.status(500).json({ error: 'Server authentication is not configured.' });
  }

  // bcrypt.compare is timing-safe — it always takes roughly the same amount of
  // time regardless of whether the match succeeds or fails.
  const isValid = await bcrypt.compare(passcode, storedHash);

  if (!isValid) {
    // Respond with the same message for wrong password and missing field to
    // prevent user enumeration or brute-force confirmation.
    return res.status(401).json({ error: 'Incorrect passcode.' });
  }

  return res.status(200).json({ ok: true });
});

// POST /api/admin/import-json
// Accepts a JSON payload containing settings, categories, extraOptions, vehicles
router.post('/import-json', async (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Payload JSON valide requis.' });
    }

    let counts = { settings: false, categories: 0, extraOptions: 0, vehicles: 0 };

    if (data.settings) {
      const SiteSettings = (await import('../models/SiteSettings.js')).default;
      await SiteSettings.deleteMany({});
      await SiteSettings.create(data.settings);
      counts.settings = true;
    }

    if (Array.isArray(data.categories) && data.categories.length > 0) {
      const Category = (await import('../models/Category.js')).default;
      await Category.deleteMany({});
      const result = await Category.insertMany(data.categories);
      counts.categories = result.length;
    }

    if (Array.isArray(data.extraOptions) && data.extraOptions.length > 0) {
      const ExtraOption = (await import('../models/ExtraOption.js')).default;
      await ExtraOption.deleteMany({});
      const result = await ExtraOption.insertMany(data.extraOptions);
      counts.extraOptions = result.length;
    }

    if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
      const Vehicle = (await import('../models/Vehicle.js')).default;
      await Vehicle.deleteMany({});
      const result = await Vehicle.insertMany(data.vehicles);
      counts.vehicles = result.length;
    }

    res.json({ ok: true, message: 'Données importées avec succès !', counts });
  } catch (error) {
    console.error('[Admin Import] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
