/**
 * Standalone script to generate class schedules.
 * Run: npx tsx scripts/generate-class-schedules.ts
 * Requires: MONGODB_URI in .env.local or environment
 */

import { config } from 'dotenv';

config({ path: '.env' });
config({ path: '.env.local' });
config();

async function main() {
  const { generateClassSchedules } = await import('../src/lib/generate-class-schedules');
  console.log('Generating class schedules for next 7 days...');
  const result = await generateClassSchedules();
  console.log(`\nResult: Created: ${result.created}, Skipped: ${result.skipped}`);
  if (result.groupsFound !== undefined) {
    console.log(`Enrollment groups: ${result.groupsFound}, Slots considered: ${result.slotsConsidered ?? '-'}`);
  }
  if (result.skipped > 0) {
    console.log('(Skipped = sessions already exist for that teacher+batch+slot+date - no duplicates created)');
  }
  if (result.errors.length > 0) {
    console.error('Errors:', result.errors);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
