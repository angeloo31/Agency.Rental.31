import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not defined in environment variables.');
  process.exit(1);
}

async function resetDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      const name = collection.collectionName;
      await collection.deleteMany({});
      console.log(`Cleared collection: ${name}`);
    }

    console.log('Database reset successfully. All seeded data removed.');
    process.exit(0);
  } catch (error) {
    console.error('Database reset failed:', error.message);
    process.exit(1);
  }
}

resetDatabase();
