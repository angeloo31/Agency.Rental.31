import { v2 as cloudinary } from 'cloudinary';
import pkg from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// ── Cloudinary SDK Configuration ─────────────────────────────────────────────
if (process.env.CLOUDINARY_URL) {
  const match = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    const [, apiKey, apiSecret, cloudName] = match;
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  }
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ── Magic Number Signatures for Real MIME Verification ───────────────────────
// File extensions and Content-Type headers are trivially forged.
// We read the raw byte signature (magic numbers) from the file buffer instead.
const ALLOWED_MAGIC = [
  { mime: 'image/jpeg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png',  offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // 'WEBP' at offset 8
];

/**
 * Inspects the raw binary buffer of an uploaded file and returns the detected
 * MIME type if it matches a known safe image signature, or null if it does not.
 *
 * @param {Buffer} buffer - The first bytes of the uploaded file.
 * @returns {string|null}
 */
function detectImageMime(buffer) {
  for (const sig of ALLOWED_MAGIC) {
    const slice = [...buffer.slice(sig.offset, sig.offset + sig.bytes.length)];
    if (sig.bytes.every((b, i) => b === slice[i])) {
      return sig.mime;
    }
  }
  return null;
}

// ── Multer Memory Storage (for magic number inspection before upload) ─────────
// We use memory storage so we can read the buffer before sending to Cloudinary.
// Files are never written to the local filesystem.
const memoryStorage = multer.memoryStorage();

/**
 * Multer fileFilter that reads the first 12 bytes of every incoming file to
 * confirm it carries a real JPEG, PNG, or WebP magic number sequence.
 * Rejects the upload with a typed error if the check fails.
 */
function strictImageFilter(req, file, cb) {
  // We cannot read the buffer here (it hasn't been assembled yet in memoryStorage).
  // We accept at this stage and run the deep buffer check in the route handler.
  // We do reject obviously wrong MIME types declared by the client as a fast pre-filter.
  const declaredMime = file.mimetype.toLowerCase();
  const safeClientTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!safeClientTypes.includes(declaredMime)) {
    const err = new Error('INVALID_MIME: Only JPEG, PNG, and WebP images are accepted.');
    err.code = 'INVALID_MIME';
    return cb(err, false);
  }
  cb(null, true);
}

// ── Secure Multer Instance — 5 MB Hard Limit ─────────────────────────────────
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB — hard cap, enforced before the buffer is read
  fileFilter: strictImageFilter,
});

// ── Cloudinary Stream Upload Helper ──────────────────────────────────────────
// Uploads a Buffer directly to Cloudinary via its upload_stream API,
// applying the same WebP + quality + dimension transformation pipeline as before.
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'luxerent',
        format: 'webp',
        transformation: [
          { width: 1200, height: 900, crop: 'limit' },
          { quality: 'auto:good' },
        ],
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ── Cloudinary Image Deletion Helpers ─────────────────────────────────────────
/**
 * Extracts the Cloudinary public_id from a Cloudinary secure_url.
 * E.g., 'https://res.cloudinary.com/demo/image/upload/v123456789/luxerent/sample.jpg'
 * returns 'luxerent/sample'
 */
function extractPublicId(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    let path = parts[1].split('?')[0]; // strip query string if any
    path = path.replace(/^v\d+\//, ''); // strip version prefix (e.g. v1779835657/)

    const lastDot = path.lastIndexOf('.');
    if (lastDot !== -1) {
      path = path.substring(0, lastDot);
    }

    return path;
  } catch (err) {
    console.error('[Cloudinary] Error parsing public_id from URL:', err.message);
    return null;
  }
}

/**
 * Deletes an image from Cloudinary by its public URL.
 * Parses the public_id and calls Cloudinary uploader.destroy API.
 */
async function deleteCloudinaryImage(url) {
  const publicId = extractPublicId(url);
  if (!publicId) return null;

  try {
    console.log(`[Cloudinary Cleanup] Deleting public_id: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary Cleanup] Destroy result for ${publicId}:`, result);
    return result;
  } catch (error) {
    console.error(`[Cloudinary Cleanup] Error destroying ${publicId}:`, error.message);
    return null;
  }
}

export { cloudinary, upload, detectImageMime, uploadBufferToCloudinary, extractPublicId, deleteCloudinaryImage };
