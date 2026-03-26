import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ClassSession } from '@/lib/models/ClassSession';
import { Student } from '@/lib/models/Student';
import { getAuthFromRequest } from '@/lib/auth';

/**
 * POST /api/classroom/session/join
 * Student joins a class session (must be within 5 min of scheduledAt)
 */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can join via this endpoint' }, { status: 403 });
    }

    await connectDB();
    const body = (await request.json()) as { sessionId: string };
    if (!body.sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const session = await ClassSession.findById(body.sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Verify student belongs to this session
    const student = await Student.findOne({ userId: decoded.userId }).select('_id').lean();
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const isInSession =
      session.studentId?.equals(student._id) ||
      (session.studentIds?.length && session.studentIds.some((id) => String(id) === String(student._id)));
    if (!isInSession) {
      return NextResponse.json({ error: 'You are not enrolled in this session' }, { status: 403 });
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

    // Session must be started by teacher or scheduled
    if (session.status !== 'in_progress' && session.status !== 'scheduled') {
      return NextResponse.json({ error: `Session is ${session.status}` }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Joined successfully',
      sessionId: session._id,
      studentBoardEnabled: session.studentBoardEnabled ?? false,
    });
  } catch (error) {
    console.error('Session join error:', error);
    return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
  }
}
