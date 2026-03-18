#!/usr/bin/env tsx
/**
 * Seed website settings (app store links, social URLs) into MongoDB.
 * Run: npm run seed-website-settings
 * Requires MONGODB_URI in env or .env
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { WebsiteSettings } from '../src/lib/models/WebsiteSettings';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-platform';

const SEED_DATA = {
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.learnbuddy.app',
  appStoreUrl: 'https://apps.apple.com/app/learnbuddy/id1234567890',
  facebookUrl: 'https://facebook.com/learnbuddy',
  twitterUrl: 'https://x.com/learnbuddy',
  linkedinUrl: 'https://linkedin.com/company/learnbuddy',
  instagramUrl: 'https://instagram.com/learnbuddy',
  youtubeUrl: 'https://youtube.com/@learnbuddy',
  contactPhone: '+91 1800-123-4567',
  contactHours: '9 AM – 6 PM IST',
  contactDays: 'Mon – Sat',
};

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Seeding website settings...');

  await WebsiteSettings.findOneAndUpdate({}, { $set: SEED_DATA }, { upsert: true });
  console.log('  ✓ playStoreUrl:', SEED_DATA.playStoreUrl);
  console.log('  ✓ appStoreUrl:', SEED_DATA.appStoreUrl);
  console.log('  ✓ facebookUrl:', SEED_DATA.facebookUrl);
  console.log('  ✓ twitterUrl:', SEED_DATA.twitterUrl);
  console.log('  ✓ linkedinUrl:', SEED_DATA.linkedinUrl);
  console.log('  ✓ instagramUrl:', SEED_DATA.instagramUrl);
  console.log('  ✓ youtubeUrl:', SEED_DATA.youtubeUrl);
  console.log('  ✓ contactPhone:', SEED_DATA.contactPhone);
  console.log('  ✓ contactHours:', SEED_DATA.contactHours);
  console.log('  ✓ contactDays:', SEED_DATA.contactDays);

  console.log('Website settings seeded successfully.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
