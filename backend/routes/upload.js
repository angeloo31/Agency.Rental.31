import express from 'express';
import { upload, detectImageMime, uploadBufferToCloudinary, deleteCloudinaryImage } from '../config/cloudinary.js';

const router = express.Router();

// POST /api/upload
// Accepts a single 'image' field, validates its magic-number byte signature,
// then streams the buffer to Cloudinary via the secure upload helper.
router.post('/', upload.single('image'), async (req, res) => {
  // ── 1. Presence Check ────────────────────────────────────────────────────
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // ── 2. Magic Number Deep Verification ────────────────────────────────────
  // Read the first 12 bytes of the file buffer.
  // This cannot be spoofed by renaming a PHP shell to ".jpg".
  const headerBytes = req.file.buffer.slice(0, 12);
  const detectedMime = detectImageMime(headerBytes);

  if (!detectedMime) {
    return res.status(415).json({
      error: 'Unsupported file type. Only genuine JPEG, PNG, and WebP images are accepted.',
    });
  }

  // ── 3. Stream Verified Buffer to Cloudinary ───────────────────────────────
  try {
    const result = await uploadBufferToCloudinary(req.file.buffer);
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error('[Upload] Cloudinary stream error:', error.message);
    return res.status(500).json({ error: 'Failed to upload image. Please try again.' });
  }
});

// DELETE /api/upload
// Accepts { url } in body to immediately destroy the specified Cloudinary asset.
router.delete('/', async (req, res) => {
  const { url } = req.body || req.query;
  if (!url) {
    return res.status(400).json({ error: 'Image URL is required for deletion.' });
  }

  try {
    const result = await deleteCloudinaryImage(url);
    return res.status(200).json({ message: 'Image deleted from Cloudinary', result });
  } catch (error) {
    console.error('[Upload DELETE] Failed to delete image from Cloudinary:', error.message);
    return res.status(500).json({ error: 'Failed to delete image from Cloudinary.' });
  }
});

// ── Multer Error Handler ──────────────────────────────────────────────────────
// Catches multer-specific errors (file too large, wrong MIME) and returns
// structured JSON instead of crashing with an HTML stack trace.
router.use((err, req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File exceeds the 5 MB size limit.' });
  }
  if (err.code === 'INVALID_MIME') {
    return res.status(415).json({ error: err.message });
  }
  console.error('[Upload] Unexpected middleware error:', err.message);
  res.status(500).json({ error: 'Upload failed due to a server error.' });
});

export default router;
