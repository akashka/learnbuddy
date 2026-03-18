import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { ClassSession } from '@/lib/models/ClassSession';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await request.json()) as any;
    const { sessionId } = body;
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const session = await ClassSession.findOne({ _id: sessionId, teacherId: teacher._id });
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.status !== 'scheduled') {
      return NextResponse.json({ error: 'Class already started or completed' }, { status: 400 });
    }

    const now = new Date();
    const scheduled = new Date(session.scheduledAt);
    const diffMinutes = (scheduled.getTime() - now.getTime()) / 60000;
    if (diffMinutes > 5) return NextResponse.json({ error: 'Join Class opens 5 minutes before start time' }, { status: 400 });
    if (diffMinutes < -30) return NextResponse.json({ error: 'Class window has passed' }, { status: 400 });

    await ClassSession.findByIdAndUpdate(sessionId, { status: 'in_progress' });

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('Start class error:', error);
    return NextResponse.json({ error: 'Failed to start class' }, { status: 500 });
  }
}
