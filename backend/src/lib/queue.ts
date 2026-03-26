/**
 * Job queue using BullMQ + Redis.
 * Moves cron logic (schedules, notifications) to background jobs.
 * When Redis is unavailable, jobs are not queued (cron endpoints fall back to sync execution).
 */
import { Queue, Worker, type Job } from 'bullmq';
import { generateClassSchedules } from './generate-class-schedules.js';
import { runCronNotifications } from './jobs/cron-notifications.js';
import { runCronDashboardMetrics } from './jobs/cron-dashboard-metrics.js';
import { processEnrollmentConfirmation } from './jobs/enrollment-confirmation.js';

const REDIS_URL = process.env.REDIS_URL || '';
const QUEUE_PREFIX = 'tp:';

type RedisConnOpts = {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
  retryStrategy?: (times: number) => number | null;
  enableReadyCheck?: boolean;
  connectTimeout?: number;
  tls?: Record<string, unknown>;
};

function getConnectionOptions(): RedisConnOpts | null {
  if (!REDIS_URL) return null;
  try {
    const u = new URL(REDIS_URL);
    const opts: RedisConnOpts = {
      host: u.hostname,
      port: parseInt(u.port || '6379', 10),
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      connectTimeout: 10000,
      retryStrategy: (times) => {
        if (times > 20) return null;
        return Math.min(times * 500, 5000);
      },
    };
    if (u.password) opts.password = decodeURIComponent(u.password);
    if (u.protocol === 'rediss:') opts.tls = { rejectUnauthorized: true };
    return opts;
  } catch {
    return null;
  }
}
const connection = getConnectionOptions();

let queue: Queue | null = null;
let worker: Worker | null = null;

export const JOB_NAMES = {
  GENERATE_SCHEDULES: 'generate-schedules',
  CRON_NOTIFICATIONS: 'cron-notifications',
  CRON_DASHBOARD_METRICS: 'cron-dashboard-metrics',
  ENROLLMENT_CONFIRMATION: 'enrollment-confirmation',
} as const;

export function getQueue(): Queue | null {
  if (!REDIS_URL || !connection) return null;
  if (queue) return queue;
  queue = new Queue('cron', {
    connection,
    prefix: QUEUE_PREFIX,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
    },
  });
  return queue;
}

export async function addJob(name: string, data?: Record<string, unknown>): Promise<string | null> {
  const q = getQueue();
  if (!q) return null;
  try {
    const job = await q.add(name, data || {});
    return job.id ?? null;
  } catch (err) {
    console.error('[Queue] Failed to add job:', err);
    return null;
  }
}

export async function setupRepeatJobs(): Promise<void> {
  const q = getQueue();
  if (!q) {
    console.log('[Queue] Redis not configured - skipping repeat jobs');
    return;
  }
  try {
    const repeatable = await q.getRepeatableJobs();
    for (const job of repeatable) {
      if (job.name === JOB_NAMES.GENERATE_SCHEDULES || job.name === JOB_NAMES.CRON_NOTIFICATIONS || job.name === JOB_NAMES.CRON_DASHBOARD_METRICS) {
        await q.removeRepeatableByKey(job.key);
      }
    }
    await q.add(JOB_NAMES.GENERATE_SCHEDULES, {}, { repeat: { pattern: '0 * * * *' } });
    await q.add(JOB_NAMES.CRON_NOTIFICATIONS, {}, { repeat: { pattern: '*/15 * * * *' } });
    await q.add(JOB_NAMES.CRON_DASHBOARD_METRICS, {}, { repeat: { pattern: '0 2 * * *' } });
    console.log('[Queue] Repeat jobs: generate-schedules (hourly), cron-notifications (every 15 min), dashboard-metrics (daily 2am)');
  } catch (err) {
    console.error('[Queue] Failed to setup repeat jobs:', err);
  }
}

export function startWorker(): void {
  if (!REDIS_URL || !connection) return;

  worker = new Worker(
    'cron',
    async (job: Job) => {
      switch (job.name) {
        case JOB_NAMES.GENERATE_SCHEDULES:
          return generateClassSchedules();
        case JOB_NAMES.CRON_NOTIFICATIONS:
          return runCronNotifications();
        case JOB_NAMES.CRON_DASHBOARD_METRICS:
          return runCronDashboardMetrics();
        case JOB_NAMES.ENROLLMENT_CONFIRMATION:
          return processEnrollmentConfirmation(job.data as { enrollmentId: string });
        default:
          throw new Error(`Unknown job: ${job.name}`);
      }
    },
    {
      connection,
      prefix: QUEUE_PREFIX,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Queue] Job ${job.name} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job?.name} failed:`, err?.message);
  });

  worker.on('error', (err) => {
    console.error('[Queue] Worker error:', err);
  });

  console.log('[Queue] Worker started');
}

export async function closeQueue(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}
