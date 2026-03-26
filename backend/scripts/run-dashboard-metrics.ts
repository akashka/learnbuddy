#!/usr/bin/env tsx
/** Run dashboard metrics cron once. Usage: npx tsx scripts/run-dashboard-metrics.ts */
import 'dotenv/config';
import { runCronDashboardMetrics } from '../src/lib/jobs/cron-dashboard-metrics';

runCronDashboardMetrics()
  .then((r) => {
    console.log('Updated:', r.updated);
    if (r.errors.length) console.error('Errors:', r.errors);
  })
  .catch(console.error)
  .finally(() => process.exit(0));
