/**
 * Cron endpoint for scheduled notifications:
 * - Class reminder 15 min before
 * - Batch start reminder for teachers (batch starts tomorrow)
 * - Payment reminder for parents (enrollment ending in 7 days)
 * When job queue (BullMQ + Redis) is configured: adds job to queue and returns immediately.
 * Otherwise: runs synchronously (legacy behavior).
 * Secured by CRON_SECRET.
 */
import { NextRequest, NextResponse } from '@/lib/next-compat';
import { addJob, getQueue, JOB_NAMES } from '@/lib/queue';
import { runCronNotifications } from '@/lib/jobs/cron-notifications';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queue = getQueue();
    if (queue) {
      const jobId = await addJob(JOB_NAMES.CRON_NOTIFICATIONS, {});
      return NextResponse.json({
        success: true,
        queued: true,
        jobId,
        message: 'Job added to queue',
      });
    }

    const result = await runCronNotifications();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Cron notifications error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
