/**
 * Clear ClassSessions (scheduled and in_progress) for the next 7 days.
 * Run before generate-class-schedules to recreate with correct studentIds.
 * Run: npx tsx scripts/clear-class-schedules.ts
 */

import { config } from 'dotenv';

config({ path: '.env.local' });
config();

async function main() {
  const connectDB = (await import('../src/lib/db')).default;
  const { ClassSession } = await import('../src/lib/models/ClassSession');

  await connectDB();

  const result = await ClassSession.deleteMany({
    status: { $in: ['scheduled', 'in_progress'] },
  });

  console.log(`Deleted ${result.deletedCount} ClassSessions (all scheduled/in_progress)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
