require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

async function resetPassword() {
  const dbUri = process.env.MONGODB_URI;
  if (!dbUri) {
    console.error('Error: MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('[WARNING] ADMIN_PASSWORD not defined in environment variables. Defaulting to "admin123".');
  }

  await mongoose.connect(dbUri);
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  const result = await mongoose.connection.collection('users').updateOne(
    { username: 'admin' },
    { $set: { passwordHash: hash } }
  );
  console.log('Password reset successfully. Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  process.exit(0);
}

resetPassword().catch(console.error);
