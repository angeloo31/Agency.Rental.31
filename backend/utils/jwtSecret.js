import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

let cachedSecret = null;

export function getJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) {
    return process.env.JWT_SECRET.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: JWT_SECRET is not set in environment variables in production.');
    process.exit(1);
  }

  if (!cachedSecret) {
    cachedSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Security Warning] JWT_SECRET is not defined in .env. Dynamically generated a 256-bit runtime secret for local development.');
  }

  return cachedSecret;
}
