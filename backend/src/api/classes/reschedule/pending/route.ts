import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { ClassSession } from '@/lib/models/ClassSession';
import { ClassRescheduleRequest } from '@/lib/models/ClassRescheduleRequest';
import { getAuthFromRequest } from '@/lib/auth';

/** Check if current user is the second party (can confirm/reject) */
function isSecondParty(
  req: { initiatedByRole: string; initiatedByProfileId: mongoose.Types.ObjectId },
  session: { teacherId: mongoose.Types.ObjectId; studentIds?: mongoose.Types.ObjectId[]; parentIds?: mongoose.Types.ObjectId[]; studentId?: mongoose.Types.ObjectId },
  profileId: mongoose.Types.ObjectId,
  role: string
): boolean {
  const teacherId = session.teacherId;
  const studentIds = session.studentIds || [];
  const parentIds = session.parentIds || [];
  const legacyStudentId = session.studentId;

  if (req.initiatedByRole === 'teacher') {
    if (role === 'parent' && parentIds.some((p) => String(p) === String(profileId))) return true;
    if (role === 'student' && (studentIds.some((s) => String(s) === String(profileId)) || (legacyStudentId && String(legacyStudentId) === String(profileId)))) return true;
    return false;
  }
  if (req.initiatedByRole === 'student' || req.initiatedByRole === 'parent') {
    return role === 'teacher' && String(teacherId) === String(profileId);
  }
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || !['student', 'parent', 'teacher'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let profileId: mongoose.Types.ObjectId;
    if (decoded.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: decoded.userId });
      if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      profileId = teacher._id;
    } else if (decoded.role === 'parent') {
      const parent = await Parent.findOne({ userId: decoded.userId });
      if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
      profileId = parent._id;
    } else {
      const student = await Student.findOne({ userId: decoded.userId });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      profileId = student._id;
    }

    const pendingRequests = await ClassRescheduleRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .lean();

    const results: Array<{
      _id: string;
      sessionId: string;
      reason: string;
      proposedSlots: { date: string; startTime: string; endTime: string }[];
      initiatedByRole: string;
      session: {
        scheduledAt: string;
        duration: number;
        subject?: string;
        batchId?: string;
        teacher?: { name: string };
        student?: { name: string };
      };
    }> = [];

    for (const req of pendingRequests) {
      const session = await ClassSession.findById(req.sessionId)
        .populate('teacherId', 'name')
        .populate('studentIds', 'name')
        .populate('studentId', 'name')
        .lean();

      if (!session || session.status !== 'scheduled') continue;

      if (!isSecondParty(req, session, profileId, decoded.role)) continue;

      const students = (session.studentIds as { name?: string }[] | null) || (session.studentId ? [session.studentId as { name?: string }] : []);
      const studentNames = students.map((s) => s?.name).filter(Boolean).join(', ') || 'Student(s)';

      results.push({
        _id: String(req._id),
        sessionId: String(req.sessionId),
        reason: req.reason,
        proposedSlots: req.proposedSlots.map((s) => ({
          date: new Date(s.date).toISOString().slice(0, 10),
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        initiatedByRole: req.initiatedByRole,
        session: {
          scheduledAt: (session.scheduledAt as Date).toISOString(),
          duration: session.duration || 60,
          subject: session.subject,
          batchId: session.batchId,
          teacher: session.teacherId ? { name: (session.teacherId as { name?: string }).name || 'Teacher' } : undefined,
          student: { name: studentNames },
        },
      });
    }

    return NextResponse.json({ pending: results });
  } catch (error) {
    console.error('Reschedule pending error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending requests' }, { status: 500 });
  }
}
