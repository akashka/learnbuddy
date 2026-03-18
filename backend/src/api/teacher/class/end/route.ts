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
    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Class not in progress' }, { status: 400 });
    }

    await ClassSession.findByIdAndUpdate(sessionId, { status: 'completed' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End class error:', error);
    return NextResponse.json({ error: 'Failed to end class' }, { status: 500 });
  }
}
