import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { ClassSession } from '@/lib/models/ClassSession';
import { ClassRescheduleRequest } from '@/lib/models/ClassRescheduleRequest';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date();
    const studentId = student._id;
    const studentQuery = {
      $or: [
        { studentId: studentId },
        { studentIds: studentId },
      ],
    };
    const past = await ClassSession.find({ ...studentQuery, status: 'completed' })
      .populate('teacherId', 'name')
      .populate('enrollmentId', 'subject')
      .sort({ scheduledAt: -1 })
      .limit(50)
      .lean();

    const upcoming = await ClassSession.find({
      ...studentQuery,
      status: { $in: ['scheduled', 'in_progress'] },
      scheduledAt: { $gte: now },
    })
      .populate('teacherId', 'name')
      .populate('enrollmentId', 'subject')
      .sort({ scheduledAt: 1 })
      .limit(100)
      .lean();

    const pendingRescheduleMap = new Map<string, string>();
    const pendingReqs = await ClassRescheduleRequest.find({
      status: 'pending',
      initiatedByRole: 'student',
      initiatedByProfileId: student._id,
    })
      .select('sessionId _id')
      .lean();
    pendingReqs.forEach((r) => pendingRescheduleMap.set(String(r.sessionId), String(r._id)));

    const formatSession = (s: Record<string, unknown>) => {
      const base = {
        _id: s._id,
        scheduledAt: s.scheduledAt,
        duration: s.duration,
        status: s.status,
        recordingUrl: s.recordingUrl,
        teacher: s.teacherId ? { name: (s.teacherId as { name?: string }).name } : null,
        subject: (s.subject as string) || (s.enrollmentId as { subject?: string })?.subject,
        batchId: s.batchId,
        classLevel: s.classLevel,
        board: s.board,
      };
      if (s.status === 'cancelled') {
        Object.assign(base, {
          cancelledBy: (s as { cancelledBy?: { role: string; profileId: unknown } }).cancelledBy,
          cancelledReason: (s as { cancelledReason?: string }).cancelledReason,
          cancelledAt: (s as { cancelledAt?: Date }).cancelledAt,
          rescheduledToSessionId: (s as { rescheduledToSessionId?: unknown }).rescheduledToSessionId,
        });
      }
      const sid = String(s._id);
      if (pendingRescheduleMap.has(sid)) {
        Object.assign(base, { pendingRescheduleRequestId: pendingRescheduleMap.get(sid) });
      }
      return base;
    };

    return NextResponse.json({
      past: past.map((s) => formatSession(s as unknown as Record<string, unknown>)),
      upcoming: upcoming.map((s) => formatSession(s as unknown as Record<string, unknown>)),
    });
  } catch (error) {
    console.error('Student classes error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
