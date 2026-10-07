import express from 'express';
import { upload, detectImageMime, uploadBufferToCloudinary, deleteCloudinaryImage } from '../config/cloudinary.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/upload
// Accepts a single 'image' field, validates its magic-number byte signature,
// then streams the buffer to Cloudinary via the secure upload helper.
router.post('/', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
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

  // ── 3. Stream Verified Buffer to Cloudinary (with Local Disk Fallback) ───
  try {
    const result = await uploadBufferToCloudinary(req.file.buffer);
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.warn('[Upload] Cloudinary stream unavailable/failed, using local fallback:', error.message);
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const fileUrlPath = await import('url');

      const __dirname = path.dirname(fileUrlPath.fileURLToPath(import.meta.url));
      const uploadsDir = path.join(__dirname, '../public/uploads');

      await fs.mkdir(uploadsDir, { recursive: true });

      const ext = detectedMime === 'image/png' ? 'png' : detectedMime === 'image/webp' ? 'webp' : 'jpg';
      const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.writeFile(filePath, req.file.buffer);
      return res.status(200).json({ url: `/uploads/${filename}` });
    } catch (localErr) {
      console.error('[Upload] Local storage fallback failed:', localErr.message);
      return res.status(500).json({ error: 'Failed to upload image.' });
    }
  }
});

// DELETE /api/upload
// Accepts { url } in body to immediately destroy the specified Cloudinary asset.
router.delete('/', requireAuth, requireAdmin, async (req, res) => {
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
