import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ClassSession } from '@/lib/models/ClassSession';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';
import { emitSessionState } from '@/lib/socket';

/**
 * POST /api/classroom/session/end
 * Teacher ends a class session
 */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teacher can end the class' }, { status: 403 });
    }

    await connectDB();
    const body = (await request.json()) as { sessionId: string; recordingUrl?: string };
    if (!body.sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const session = await ClassSession.findById(body.sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const teacher = await Teacher.findOne({ userId: decoded.userId }).select('_id').lean();
    if (!teacher || !session.teacherId?.equals(teacher._id)) {
      return NextResponse.json({ error: 'Not your session' }, { status: 403 });
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Session is not in progress' }, { status: 400 });
    }

    session.status = 'completed';
    if (body.recordingUrl) {
      session.recordingUrl = body.recordingUrl;
    }
    await session.save();

    emitSessionState(body.sessionId, 'completed');

    return NextResponse.json({ message: 'Session ended', sessionId: session._id });
  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
}
