import { NextRequest, NextResponse } from '@/lib/next-compat';
import { generateClassSchedules } from '@/lib/generate-class-schedules';
import { addJob, getQueue, JOB_NAMES } from '@/lib/queue';

/**
 * Cron endpoint to generate class schedules for the next 7 days.
 * When job queue (BullMQ + Redis) is configured: adds job to queue and returns immediately.
 * Otherwise: runs synchronously (legacy behavior).
 * Secured by CRON_SECRET - set in env and pass as Authorization: Bearer <secret>
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queue = getQueue();
    if (queue) {
      const jobId = await addJob(JOB_NAMES.GENERATE_SCHEDULES, {});
      return NextResponse.json({
        success: true,
        queued: true,
        jobId,
        message: 'Job added to queue',
      });
    }

    const result = await generateClassSchedules();
    return NextResponse.json({
      success: true,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Cron generate-schedules error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
