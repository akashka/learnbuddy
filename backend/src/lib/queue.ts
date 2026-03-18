/**
 * Job queue using BullMQ + Redis.
 * Moves cron logic (schedules, notifications) to background jobs.
 * When Redis is unavailable, jobs are not queued (cron endpoints fall back to sync execution).
 */
import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { generateClassSchedules } from './generate-class-schedules.js';
import { runCronNotifications } from './jobs/cron-notifications.js';

const REDIS_URL = process.env.REDIS_URL || '';
const QUEUE_PREFIX = 'tp:';

function createConnection(): IORedis | null {
  if (!REDIS_URL) return null;
  try {
    return new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy(times: number) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });
  } catch {
    return null;
  }
}

let queue: Queue | null = null;
let worker: Worker | null = null;

export const JOB_NAMES = {
  GENERATE_SCHEDULES: 'generate-schedules',
  CRON_NOTIFICATIONS: 'cron-notifications',
} as const;

export function getQueue(): Queue | null {
  if (!REDIS_URL) return null;
  if (queue) return queue;
  const conn = createConnection();
  if (!conn) return null;
  queue = new Queue('cron', {
    connection: conn,
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
      if (job.name === JOB_NAMES.GENERATE_SCHEDULES || job.name === JOB_NAMES.CRON_NOTIFICATIONS) {
        await q.removeRepeatableByKey(job.key);
      }
    }
    await q.add(JOB_NAMES.GENERATE_SCHEDULES, {}, { repeat: { pattern: '0 * * * *' } });
    await q.add(JOB_NAMES.CRON_NOTIFICATIONS, {}, { repeat: { pattern: '*/15 * * * *' } });
    console.log('[Queue] Repeat jobs: generate-schedules (hourly), cron-notifications (every 15 min)');
  } catch (err) {
    console.error('[Queue] Failed to setup repeat jobs:', err);
  }
}

export function startWorker(): void {
  if (!REDIS_URL) return;
  const conn = createConnection();
  if (!conn) return;

  worker = new Worker(
    'cron',
    async (job: Job) => {
      switch (job.name) {
        case JOB_NAMES.GENERATE_SCHEDULES:
          return generateClassSchedules();
        case JOB_NAMES.CRON_NOTIFICATIONS:
          return runCronNotifications();
        default:
          throw new Error(`Unknown job: ${job.name}`);
      }
    },
    {
      connection: conn,
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
