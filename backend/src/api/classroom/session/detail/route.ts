import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ClassSession } from '@/lib/models/ClassSession';
import { Student } from '@/lib/models/Student';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

/**
 * GET /api/classroom/session/detail?sessionId=...
 * Returns session details for classroom pre-join and classroom page.
 */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const session = await ClassSession.findById(sessionId)
      .populate('teacherId', 'name photoUrl userId')
      .populate('studentId', 'name photoUrl userId')
      .populate('studentIds', 'name photoUrl userId')
      .lean();

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Verify the calling user is part of this session
    if (decoded.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: decoded.userId }).select('_id').lean();
      if (!teacher || String(session.teacherId?._id || session.teacherId) !== String(teacher._id)) {
        return NextResponse.json({ error: 'Not your session' }, { status: 403 });
      }
    } else if (decoded.role === 'student') {
      const student = await Student.findOne({ userId: decoded.userId }).select('_id').lean();
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      const isInSession =
        String(session.studentId?._id || session.studentId) === String(student._id) ||
        (session.studentIds?.length && session.studentIds.some((s: any) => String(s._id || s) === String(student._id)));
      if (!isInSession) {
        return NextResponse.json({ error: 'Not your session' }, { status: 403 });
      }
    }

    return NextResponse.json({
      session: {
        _id: session._id,
        subject: session.subject,
        board: session.board,
        classLevel: session.classLevel,
        scheduledAt: session.scheduledAt,
        duration: session.duration,
        status: session.status,
        teacher: session.teacherId,
        student: session.studentId,
        students: session.studentIds,
        studentBoardEnabled: session.studentBoardEnabled ?? false,
        warningCounts: session.warningCounts || { teacher: 0, student: 0 },
      },
    });
  } catch (error) {
    console.error('Session detail error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}
