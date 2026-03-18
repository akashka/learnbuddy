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

/** Determine if current user is the "second party" who can confirm */
function canConfirm(
  req: { initiatedByRole: string; initiatedByProfileId: mongoose.Types.ObjectId },
  session: { teacherId: mongoose.Types.ObjectId; studentIds?: mongoose.Types.ObjectId[]; parentIds?: mongoose.Types.ObjectId[]; studentId?: mongoose.Types.ObjectId },
  profileId: mongoose.Types.ObjectId,
  role: string
): boolean {
  const teacherId = session.teacherId;
  const studentIds = session.studentIds || [];
  const parentIds = session.parentIds || [];
  const legacyStudentId = session.studentId;

  // Teacher initiated -> parent or student confirms
  if (req.initiatedByRole === 'teacher') {
    if (role === 'parent' && parentIds.some((p) => String(p) === String(profileId))) return true;
    if (role === 'student' && (studentIds.some((s) => String(s) === String(profileId)) || (legacyStudentId && String(legacyStudentId) === String(profileId)))) return true;
    return false;
  }
  // Student or parent initiated -> teacher confirms
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

    const body = (await request.json()) as any;
    const { requestId, confirmedSlotIndex } = body;
    if (requestId === undefined || confirmedSlotIndex === undefined) {
      return NextResponse.json({ error: 'requestId and confirmedSlotIndex required' }, { status: 400 });
    }
    const slotIndex = Number(confirmedSlotIndex);
    if (slotIndex !== 0 && slotIndex !== 1) {
      return NextResponse.json({ error: 'confirmedSlotIndex must be 0 or 1' }, { status: 400 });
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

    const rescheduleReq = await ClassRescheduleRequest.findById(requestId);
    if (!rescheduleReq) return NextResponse.json({ error: 'Reschedule request not found' }, { status: 404 });
    if (rescheduleReq.status !== 'pending') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 });
    }

    const session = await ClassSession.findById(rescheduleReq.sessionId).lean();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.status !== 'scheduled') {
      return NextResponse.json({ error: 'Original session is no longer scheduled' }, { status: 400 });
    }

    if (!canConfirm(rescheduleReq, session, profileId, decoded.role)) {
      return NextResponse.json({ error: 'You cannot confirm this reschedule request' }, { status: 403 });
    }

    if (slotIndex >= rescheduleReq.proposedSlots.length) {
      return NextResponse.json({ error: 'Invalid slot index' }, { status: 400 });
    }

    const slot = rescheduleReq.proposedSlots[slotIndex];
    const scheduledAt = new Date(slot.date);
    const [h, m] = slot.startTime.includes(':') ? slot.startTime.split(':').map(Number) : [0, 0];
    scheduledAt.setHours(h, m, 0, 0);

    if (scheduledAt <= new Date()) {
      return NextResponse.json({ error: 'Selected slot is in the past' }, { status: 400 });
    }

    // Create new ClassSession (copy from original)
    const newSession = await ClassSession.create({
      teacherId: session.teacherId,
      studentId: session.studentId,
      studentIds: session.studentIds,
      parentIds: session.parentIds,
      enrollmentIds: session.enrollmentIds,
      enrollmentId: session.enrollmentId,
      batchId: session.batchId,
      subject: session.subject,
      board: session.board,
      classLevel: session.classLevel,
      scheduledAt,
      duration: session.duration,
      status: 'scheduled',
      aiMonitoringAlerts: [],
    });

    // Mark original session as cancelled
    await ClassSession.findByIdAndUpdate(rescheduleReq.sessionId, {
      status: 'cancelled',
      cancelledBy: {
        role: rescheduleReq.initiatedByRole,
        profileId: rescheduleReq.initiatedByProfileId,
      },
      cancelledReason: rescheduleReq.reason,
      cancelledAt: new Date(),
      rescheduledToSessionId: newSession._id,
    });

    // Update reschedule request
    await ClassRescheduleRequest.findByIdAndUpdate(requestId, {
      status: 'confirmed',
      confirmedSlotIndex: slotIndex,
      confirmedByProfileId: profileId,
      confirmedAt: new Date(),
      newSessionId: newSession._id,
    });

    // Notify initiator that reschedule was confirmed
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
      const subject = session.subject || 'Class';
      const initiatorUser = await User.findById(initiatorUserId).select('role').lean();
      const ctaByRole: Record<string, string> = { parent: '/parent/classes', teacher: '/teacher/classes', student: '/student/classes' };
      const ctaUrl = ctaByRole[initiatorUser?.role as string] || '/parent/classes';
      createNotification({
        userId: initiatorUserId,
        type: 'reschedule_confirmed',
        title: 'Reschedule confirmed!',
        message: `Your ${subject} class has been rescheduled successfully.`,
        ctaLabel: 'View Class',
        ctaUrl,
        entityType: 'reschedule',
        entityId: String(newSession._id),
      }).catch((err) => console.error('Notification error:', err));
    }

    return NextResponse.json({
      success: true,
      newSessionId: newSession._id,
      scheduledAt: newSession.scheduledAt,
      message: 'Class rescheduled successfully.',
    });
  } catch (error) {
    console.error('Reschedule confirm error:', error);
    return NextResponse.json({ error: 'Failed to confirm reschedule' }, { status: 500 });
  }
}
