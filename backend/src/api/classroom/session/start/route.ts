import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ClassSession } from '@/lib/models/ClassSession';
import { Student } from '@/lib/models/Student';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';
import { emitSessionState } from '@/lib/socket';

/**
 * POST /api/classroom/session/start
 * Teacher starts a class session (must be within 5 min of scheduledAt)
 */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can start a class' }, { status: 403 });
    }

    await connectDB();
    const body = (await request.json()) as { sessionId: string };
    if (!body.sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const session = await ClassSession.findById(body.sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Verify this teacher owns the session
    const teacher = await Teacher.findOne({ userId: decoded.userId }).select('_id').lean();
    if (!teacher || !session.teacherId?.equals(teacher._id)) {
      return NextResponse.json({ error: 'Not your session' }, { status: 403 });
    }

    if (session.status === 'in_progress') {
      return NextResponse.json({ message: 'Session already started', sessionId: session._id });
    }
    if (session.status !== 'scheduled') {
      return NextResponse.json({ error: `Cannot start session with status: ${session.status}` }, { status: 400 });
    }

    // Check 5-minute join window
    const now = new Date();
    const scheduledAt = new Date(session.scheduledAt);
    const windowStart = new Date(scheduledAt.getTime() - 5 * 60 * 1000);
    if (now < windowStart) {
      const diffMs = windowStart.getTime() - now.getTime();
      const diffMin = Math.ceil(diffMs / 60000);
      return NextResponse.json(
        { error: `Too early. You can join ${diffMin} minute(s) before the scheduled time.` },
        { status: 400 }
      );
    }

    session.status = 'in_progress';
    await session.save();

    emitSessionState(body.sessionId, 'in_progress');

    return NextResponse.json({ message: 'Session started', sessionId: session._id });
  } catch (error) {
    console.error('Session start error:', error);
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
  }
}
