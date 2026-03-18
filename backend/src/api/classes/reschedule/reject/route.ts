import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { ClassSession } from '@/lib/models/ClassSession';
import { ClassRescheduleRequest } from '@/lib/models/ClassRescheduleRequest';
import { getAuthFromRequest } from '@/lib/auth';
import { createNotification } from '@/lib/notification-service';
import { User } from '@/lib/models/User';

function canReject(
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

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || !['student', 'parent', 'teacher'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, reason } = body;
    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 });

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

    const rescheduleReq = await ClassRescheduleRequest.findById(requestId);
    if (!rescheduleReq) return NextResponse.json({ error: 'Reschedule request not found' }, { status: 404 });
    if (rescheduleReq.status !== 'pending') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 });
    }

    const session = await ClassSession.findById(rescheduleReq.sessionId).lean();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (!canReject(rescheduleReq, session, profileId, decoded.role)) {
      return NextResponse.json({ error: 'You cannot reject this reschedule request' }, { status: 403 });
    }

    await ClassRescheduleRequest.findByIdAndUpdate(requestId, {
      status: 'rejected',
      rejectedReason: reason?.trim() || undefined,
    });

    // Notify initiator that reschedule was rejected
    let initiatorUserId: mongoose.Types.ObjectId | null = null;
    if (rescheduleReq.initiatedByRole === 'teacher') {
      const t = await Teacher.findById(rescheduleReq.initiatedByProfileId).select('userId').lean();
      initiatorUserId = t?.userId as mongoose.Types.ObjectId || null;
    } else if (rescheduleReq.initiatedByRole === 'parent') {
      const p = await Parent.findById(rescheduleReq.initiatedByProfileId).select('userId').lean();
      initiatorUserId = p?.userId as mongoose.Types.ObjectId || null;
    } else {
      const s = await Student.findById(rescheduleReq.initiatedByProfileId).select('userId').lean();
      initiatorUserId = s?.userId as mongoose.Types.ObjectId || null;
    }
    if (initiatorUserId) {
      const subject = (session as { subject?: string }).subject || 'Class';
      const initiatorUser = await User.findById(initiatorUserId).select('role').lean();
      const ctaByRole: Record<string, string> = { parent: '/parent/classes', teacher: '/teacher/classes', student: '/student/classes' };
      const ctaUrl = ctaByRole[(initiatorUser as { role?: string })?.role || ''] || '/parent/classes';
      createNotification({
        userId: initiatorUserId,
        type: 'reschedule_rejected',
        title: 'Reschedule rejected',
        message: `Your request to reschedule the ${subject} class was rejected.`,
        ctaLabel: 'View Classes',
        ctaUrl,
        entityType: 'reschedule',
        entityId: String(requestId),
      }).catch((err) => console.error('Notification error:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Reschedule request rejected.',
    });
  } catch (error) {
    console.error('Reschedule reject error:', error);
    return NextResponse.json({ error: 'Failed to reject reschedule' }, { status: 500 });
  }
}
