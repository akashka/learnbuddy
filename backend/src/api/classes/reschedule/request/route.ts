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
import { sendTemplatedEmail } from '@/lib/mailgun-service';
import { User } from '@/lib/models/User';

/** Minimum hours before session to request reschedule */
const MIN_HOURS_BEFORE = 2;
/** Proposed slots must be within next 30 days */
const MAX_DAYS_AHEAD = 30;

function parseTimeToMinutes(timeStr: string): number {
  const t = String(timeStr).trim();
  const match12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const ampm = match12[3]?.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const match24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    return h * 60 + m;
  }
  return 0;
}

function validateProposedSlot(slot: { date: string; startTime: string; endTime: string }): string | null {
  const date = new Date(slot.date);
  if (isNaN(date.getTime())) return 'Invalid date';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const slotDate = new Date(date);
  slotDate.setHours(0, 0, 0, 0);
  if (slotDate < now) return 'Date must be today or in the future';
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
  if (slotDate > maxDate) return `Date must be within ${MAX_DAYS_AHEAD} days`;
  const startMins = parseTimeToMinutes(slot.startTime);
  const endMins = parseTimeToMinutes(slot.endTime);
  if (endMins <= startMins) return 'End time must be after start time';
  if (endMins - startMins < 30) return 'Slot must be at least 30 minutes';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || !['student', 'parent', 'teacher'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const { sessionId, reason, proposedSlots } = body;
    if (!sessionId || !reason?.trim() || !Array.isArray(proposedSlots) || proposedSlots.length < 1 || proposedSlots.length > 2) {
      return NextResponse.json({ error: 'sessionId, reason, and 1-2 proposedSlots required' }, { status: 400 });
    }

    await connectDB();

    let initiatedByRole: 'student' | 'parent' | 'teacher';
    let initiatedByProfileId: mongoose.Types.ObjectId;

    if (decoded.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: decoded.userId });
      if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      initiatedByRole = 'teacher';
      initiatedByProfileId = teacher._id;
    } else if (decoded.role === 'parent') {
      const parent = await Parent.findOne({ userId: decoded.userId });
      if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
      initiatedByRole = 'parent';
      initiatedByProfileId = parent._id;
    } else {
      const student = await Student.findOne({ userId: decoded.userId });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      initiatedByRole = 'student';
      initiatedByProfileId = student._id;
    }

    const session = await ClassSession.findById(sessionId).lean();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.status !== 'scheduled') {
      return NextResponse.json({ error: 'Can only reschedule scheduled classes' }, { status: 400 });
    }

    const scheduledAt = new Date(session.scheduledAt);
    const now = new Date();
    const hoursBefore = (scheduledAt.getTime() - now.getTime()) / (60 * 60 * 1000);
    if (hoursBefore < MIN_HOURS_BEFORE) {
      return NextResponse.json({ error: `Must request reschedule at least ${MIN_HOURS_BEFORE} hours before class` }, { status: 400 });
    }

    // Verify user is part of this session
    const teacherId = session.teacherId as mongoose.Types.ObjectId;
    const studentIds = (session.studentIds || []) as mongoose.Types.ObjectId[];
    const parentIds = (session.parentIds || []) as mongoose.Types.ObjectId[];
    const legacyStudentId = session.studentId as mongoose.Types.ObjectId | undefined;

    const isTeacher = decoded.role === 'teacher' && String(teacherId) === String(initiatedByProfileId);
    const isStudent = decoded.role === 'student' && (studentIds.some((s) => String(s) === String(initiatedByProfileId)) || (legacyStudentId && String(legacyStudentId) === String(initiatedByProfileId)));
    const isParent = decoded.role === 'parent' && parentIds.some((p) => String(p) === String(initiatedByProfileId));

    if (!isTeacher && !isStudent && !isParent) {
      return NextResponse.json({ error: 'You are not part of this class' }, { status: 403 });
    }

    // Check for existing pending request
    const existing = await ClassRescheduleRequest.findOne({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      status: 'pending',
    });
    if (existing) {
      return NextResponse.json({ error: 'A reschedule request is already pending for this class' }, { status: 400 });
    }

    // Validate proposed slots
    const slots: { date: Date; startTime: string; endTime: string }[] = [];
    for (let i = 0; i < proposedSlots.length; i++) {
      const s = proposedSlots[i];
      if (!s?.date || !s?.startTime || !s?.endTime) {
        return NextResponse.json({ error: `Slot ${i + 1}: date, startTime, endTime required` }, { status: 400 });
      }
      const err = validateProposedSlot(s);
      if (err) return NextResponse.json({ error: `Slot ${i + 1}: ${err}` }, { status: 400 });
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      const [h, m] = s.startTime.includes(':') ? s.startTime.split(':').map(Number) : [0, 0];
      d.setHours(h, m, 0, 0);
      slots.push({ date: d, startTime: s.startTime, endTime: s.endTime });
    }

    const req = await ClassRescheduleRequest.create({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      initiatedByRole,
      initiatedByProfileId,
      reason: reason.trim(),
      proposedSlots: slots,
      status: 'pending',
    });

    // Notify other party/parties (exclude initiator)
    let initiatorUserId: string | null = null;
    if (initiatedByRole === 'teacher') {
      const t = await Teacher.findById(initiatedByProfileId).select('userId').lean();
      initiatorUserId = t?.userId ? String(t.userId) : null;
    } else if (initiatedByRole === 'parent') {
      const p = await Parent.findById(initiatedByProfileId).select('userId').lean();
      initiatorUserId = p?.userId ? String(p.userId) : null;
    } else {
      const s = await Student.findById(initiatedByProfileId).select('userId').lean();
      initiatorUserId = s?.userId ? String(s.userId) : null;
    }
    const teacher = await Teacher.findById(teacherId).select('userId').lean();
    const students = await Student.find({ _id: { $in: studentIds.length ? studentIds : (legacyStudentId ? [legacyStudentId] : []) } }).select('userId').lean();
    const parents = await Parent.find({ _id: { $in: parentIds } }).select('userId').lean();
    const targetUserIds: mongoose.Types.ObjectId[] = [];
    if (teacher?.userId && String(teacher.userId) !== initiatorUserId) targetUserIds.push(teacher.userId as mongoose.Types.ObjectId);
    for (const s of students) {
      if (s?.userId && String(s.userId) !== initiatorUserId) targetUserIds.push(s.userId as mongoose.Types.ObjectId);
    }
    for (const p of parents) {
      if (p?.userId && String(p.userId) !== initiatorUserId) targetUserIds.push(p.userId as mongoose.Types.ObjectId);
    }
    if (targetUserIds.length > 0) {
      const subject = (session as { subject?: string }).subject || 'Class';
      const appUrl = process.env.APP_URL || process.env.BACKEND_URL || 'https://learnbuddy.com';
      const users = await User.find({ _id: { $in: targetUserIds } }).select('_id role email').lean();
      const ctaPathByRole: Record<string, string> = { parent: '/parent/classes', teacher: '/teacher/classes', student: '/student/classes' };
      for (const u of users) {
        const ctaPath = ctaPathByRole[u.role as string] || '/parent/classes';
        const ctaUrlFull = `${appUrl}${ctaPath}`;
        createNotification({
          userId: u._id as mongoose.Types.ObjectId,
          type: 'reschedule_request',
          title: 'Reschedule request',
          message: `Someone requested to reschedule your ${subject} class. Please confirm or reject.`,
          ctaLabel: 'View Request',
          ctaUrl: ctaPath,
          entityType: 'reschedule',
          entityId: String(req._id),
        }).catch((err) => console.error('Notification error:', err));
        let email: string | null = (u as { email?: string }).email || null;
        if (u.role === 'student' && u._id) {
          const student = await Student.findOne({ userId: u._id }).populate('parentId', 'userId').lean();
          const parent = student?.parentId as { userId?: mongoose.Types.ObjectId } | null;
          if (parent?.userId) {
            const parentUser = await User.findById(parent.userId).select('email').lean();
            email = (parentUser as { email?: string })?.email || null;
          }
        }
        if (email) {
          sendTemplatedEmail({
            to: email,
            templateCode: 'reschedule_request',
            variables: { subject, ctaUrl: ctaUrlFull },
          }).catch((err) => console.error('Email error:', err));
        }
      }
    }

    return NextResponse.json({
      success: true,
      requestId: req._id,
      message: 'Reschedule request submitted. The other party will be notified to confirm one of your proposed slots.',
    });
  } catch (error) {
    console.error('Reschedule request error:', error);
    return NextResponse.json({ error: 'Failed to submit reschedule request' }, { status: 500 });
  }
}
