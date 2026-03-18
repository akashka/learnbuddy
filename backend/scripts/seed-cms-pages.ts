#!/usr/bin/env tsx
/**
 * Seed CMS pages into MongoDB. Run: npx tsx scripts/seed-cms-pages.ts
 * Requires MONGODB_URI in env or .env
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { CmsPage } from '../src/lib/models/CmsPage';
import { CMS_SEED_PAGES } from '../src/lib/cms-seed-data';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-platform';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Seeding CMS pages...');

  for (const page of CMS_SEED_PAGES) {
    await CmsPage.findOneAndUpdate(
      { slug: page.slug },
      { $set: page },
      { upsert: true }
    );
    console.log(`  ✓ ${page.slug}`);
  }

  console.log(`Seeded ${CMS_SEED_PAGES.length} CMS pages successfully.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
