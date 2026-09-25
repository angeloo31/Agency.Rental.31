import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { cloudinary, extractPublicId } from '../config/cloudinary.js';
import Vehicle from '../models/Vehicle.js';
import SiteSettings from '../models/SiteSettings.js';

dotenv.config();

async function cleanupCloudinaryOrphans() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Collect all active public_ids from database
    const activePublicIds = new Set();

    // Vehicles
    const vehicles = await Vehicle.find({});
    for (const v of vehicles) {
      if (Array.isArray(v.images)) {
        for (const imgUrl of v.images) {
          const pid = extractPublicId(imgUrl);
          if (pid) activePublicIds.add(pid);
        }
      }
      if (v.landingImage) {
        const pid = extractPublicId(v.landingImage);
        if (pid) activePublicIds.add(pid);
      }
    }

    // Site Settings
    const settings = await SiteSettings.findOne();
    if (settings) {
      if (settings.storeLogo) {
        const pid = extractPublicId(settings.storeLogo);
        if (pid) activePublicIds.add(pid);
      }
      if (settings.hero?.backgroundImage) {
        const pid = extractPublicId(settings.hero.backgroundImage);
        if (pid) activePublicIds.add(pid);
      }
      if (settings.aboutStoryImage) {
        const pid = extractPublicId(settings.aboutStoryImage);
        if (pid) activePublicIds.add(pid);
      }
    }

    console.log(`Found ${activePublicIds.size} active image public_ids referenced in MongoDB:`);
    console.log(Array.from(activePublicIds));

    // 2. Fetch all resources in Cloudinary under prefix 'luxerent'
    console.log('\nFetching images from Cloudinary under folder "luxerent"...');
    let resources = [];
    try {
      const res = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'luxerent',
        max_results: 500
      });
      resources = res.resources || [];
    } catch (err) {
      console.error('Error fetching Cloudinary resources:', err.message);
    }

    console.log(`Found ${resources.length} total images in Cloudinary "luxerent" folder.`);

    let deletedCount = 0;
    let keptCount = 0;

    for (const res of resources) {
      const publicId = res.public_id;
      if (!activePublicIds.has(publicId)) {
        console.log(`[DELETE ORPHAN] Deleting unused image from Cloudinary: ${publicId}`);
        const delRes = await cloudinary.uploader.destroy(publicId);
        console.log(` -> Result for ${publicId}:`, delRes.result || delRes);
        deletedCount++;
      } else {
        console.log(`[KEEP ACTIVE] Image is currently in use: ${publicId}`);
        keptCount++;
      }
    }

    console.log(`\nCleanup Complete! Deleted: ${deletedCount} unused pics | Kept: ${keptCount} active pics.`);

  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

cleanupCloudinaryOrphans();
