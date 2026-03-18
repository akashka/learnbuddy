#!/usr/bin/env tsx
/**
 * Seed discount codes into MongoDB.
 * Run: npx tsx scripts/seed-discount-codes.ts
 * Requires MONGODB_URI in env or .env
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { DiscountCode } from '../src/lib/models/DiscountCode';
import { DISCOUNT_CODE_SEED } from '../src/lib/discount-code-seed';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-platform';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Seeding discount codes...');

  let created = 0;
  let updated = 0;
  for (const item of DISCOUNT_CODE_SEED) {
    const existing = await DiscountCode.findOne({ code: item.code });
    if (!existing) {
      await DiscountCode.create(item);
      created++;
      console.log(`  ✓ ${item.code} - ${item.type === 'percent' ? `${item.value}%` : `₹${item.value}`} off`);
    } else {
      const updates: Record<string, unknown> = {};
      if ('maxDiscountAmount' in item && existing.maxDiscountAmount !== (item as { maxDiscountAmount?: number }).maxDiscountAmount) {
        updates.maxDiscountAmount = (item as { maxDiscountAmount?: number }).maxDiscountAmount;
      }
      if (Object.keys(updates).length > 0) {
        await DiscountCode.findByIdAndUpdate(existing._id, { $set: updates });
        updated++;
        console.log(`  ↻ ${item.code} updated`);
      } else {
        console.log(`  - ${item.code} (already exists)`);
      }
    }
  }

  console.log(`Seeded ${created} new, ${updated} updated discount codes (${DISCOUNT_CODE_SEED.length} total)`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
