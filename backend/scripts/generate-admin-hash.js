/**
 * Run this script ONCE to generate the bcrypt hash for your admin passcode:
 *
 *   node scripts/generate-admin-hash.js
 *
 * Copy the output value into your .env file as:
 *   ADMIN_HASH=<output>
 *
 * After that, delete this script or add it to .gitignore.
 * Never commit a plaintext passcode to source control.
 */
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const PLAINTEXT_PASSCODE = process.argv[2] || 'admin123';

if (!process.argv[2]) {
  console.warn('[WARNING] No passcode argument supplied. Using default "admin123".');
  console.warn('Usage: node scripts/generate-admin-hash.js <your-strong-passcode>');
  console.warn('');
}

const hash = await bcrypt.hash(PLAINTEXT_PASSCODE, SALT_ROUNDS);
console.log('\nAdd this line to your backend/.env file:\n');
console.log(`ADMIN_HASH=${hash}`);
console.log('\nAlso add FRONTEND_URL to your .env if not already present:');
console.log('FRONTEND_URL=http://localhost:3000');
