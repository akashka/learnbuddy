import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ClassSession } from '@/lib/models/ClassSession';
import { getAuthFromRequest } from '@/lib/auth';

/**
 * POST /api/classroom/session/board
 * Save board snapshot data URL and optionally toggle student board permissions.
 */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teacher can save board snapshots' }, { status: 403 });
    }

    await connectDB();
    const body = (await request.json()) as {
      sessionId: string;
      snapshotDataUrl?: string;
      studentBoardEnabled?: boolean;
    };

    if (!body.sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (body.snapshotDataUrl) {
      update.boardSnapshotUrl = body.snapshotDataUrl;
      update.$push = { boardHistory: { url: body.snapshotDataUrl, timestamp: new Date() } };
    }
    if (typeof body.studentBoardEnabled === 'boolean') {
      update.studentBoardEnabled = body.studentBoardEnabled;
    }

    await ClassSession.findByIdAndUpdate(body.sessionId, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Board save error:', error);
    return NextResponse.json({ error: 'Failed to save board' }, { status: 500 });
  }
}
