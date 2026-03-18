#!/usr/bin/env tsx
/**
 * Seed WebsitePageContent into MongoDB. Run: npx tsx scripts/seed-website-page-content.ts
 * Requires MONGODB_URI in env or .env
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { WebsitePageContent } from '../src/lib/models/WebsitePageContent';
import { WEBSITE_PAGE_CONTENT_SEED } from '../src/lib/website-page-content-seed';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-platform';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Seeding WebsitePageContent...');

  for (const [pageType, sections] of Object.entries(WEBSITE_PAGE_CONTENT_SEED)) {
    await WebsitePageContent.findOneAndUpdate(
      { pageType },
      { $set: { sections } },
      { upsert: true }
    );
    console.log(`  ✓ ${pageType}`);
  }

  console.log(`Seeded ${Object.keys(WEBSITE_PAGE_CONTENT_SEED).length} page types successfully.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
