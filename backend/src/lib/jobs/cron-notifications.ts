/**
 * Cron notifications job processor.
 * - Class reminder 15 min before
 * - Batch start reminder for teachers (batch starts tomorrow)
 * - Payment reminder for parents (enrollment ending in 7 days)
 * - Review reminder for parents (unreviewed teachers, weekly)
 */
import mongoose from 'mongoose';
import connectDB from '../db.js';
import { ClassSession } from '../models/ClassSession.js';
import { Enrollment } from '../models/Enrollment.js';
import { Teacher } from '../models/Teacher.js';
import { Parent } from '../models/Parent.js';
import { TeacherReview } from '../models/TeacherReview.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { createNotification } from '../notification-service.js';

export interface CronNotificationsResult {
  classReminders: number;
  batchReminders: number;
  paymentReminders: number;
  reviewReminders: number;
  errors: string[];
}

export async function runCronNotifications(): Promise<CronNotificationsResult> {
  await connectDB();
  const result: CronNotificationsResult = {
    classReminders: 0,
    batchReminders: 0,
    paymentReminders: 0,
    reviewReminders: 0,
    errors: [],
  };

  const now = new Date();

  // 1. Class reminder 15 min before
  const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
  const sessions = await ClassSession.find({
    status: 'scheduled',
    scheduledAt: { $gte: now, $lte: in15Min },
  })
    .populate('teacherId', 'userId')
    .populate('studentIds', 'userId')
    .populate('parentIds', 'userId')
    .lean();

  const seenClassUsers = new Set<string>();
  for (const s of sessions) {
    const subject = s.subject || 'Class';
    const scheduledAt = new Date(s.scheduledAt);
    const timeStr = scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const teacher = s.teacherId as { userId?: mongoose.Types.ObjectId } | null;
    const studentIds = (s.studentIds || []) as { userId?: mongoose.Types.ObjectId }[];
    const parentIds = (s.parentIds || []) as { userId?: mongoose.Types.ObjectId }[];
    const userIds: mongoose.Types.ObjectId[] = [];
    if (teacher?.userId) userIds.push(teacher.userId);
    for (const st of studentIds) if (st?.userId) userIds.push(st.userId);
    for (const p of parentIds) if (p?.userId) userIds.push(p.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('_id role').lean();
    const ctaByRole: Record<string, string> = {
      parent: '/parent/classes',
      teacher: '/teacher/classes',
      student: '/student/classes',
    };
    for (const u of users) {
      const uid = u._id;
      const key = `${s._id}-${uid}`;
      if (seenClassUsers.has(key)) continue;
      seenClassUsers.add(key);
      try {
        const existing = await Notification.findOne({
          userId: uid,
          type: 'class_reminder_15min',
          entityId: String(s._id),
          createdAt: { $gte: new Date(now.getTime() - 20 * 60 * 1000) },
        });
        if (!existing) {
          await createNotification({
            userId: uid as mongoose.Types.ObjectId,
            type: 'class_reminder_15min',
            title: 'Class starting soon!',
            message: `Your ${subject} class starts at ${timeStr}. Get ready!`,
            ctaLabel: 'Join Class',
            ctaUrl: ctaByRole[(u as { role?: string }).role || ''] || '/student/classes',
            entityType: 'class',
            entityId: String(s._id),
            metadata: { scheduledAt: s.scheduledAt },
          });
          result.classReminders++;
        }
      } catch (err) {
        result.errors.push(String(err));
      }
    }
  }

  // 2. Batch start reminder for teachers (batch starts tomorrow)
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const teachers = await Teacher.find({ status: 'qualified' }).lean();
  for (const t of teachers) {
    const batches = (t.batches || []) as { name?: string; subject?: string; startDate?: Date }[];
    for (let i = 0; i < batches.length; i++) {
      const b = batches[i];
      const startDate = b?.startDate ? new Date(b.startDate) : null;
      if (!startDate) continue;
      startDate.setHours(0, 0, 0, 0);
      if (startDate >= tomorrow && startDate <= tomorrowEnd) {
        try {
          const existing = await Notification.findOne({
            userId: t.userId,
            type: 'batch_start_reminder',
            entityId: `batch-${t._id}-${i}`,
            createdAt: { $gte: new Date(now.getTime() - 25 * 60 * 60 * 1000) },
          });
          if (!existing) {
            await createNotification({
              userId: t.userId as mongoose.Types.ObjectId,
              type: 'batch_start_reminder',
              title: 'Batch starts tomorrow!',
              message: `Your ${b.subject || 'batch'} (${b.name || 'Batch'}) starts tomorrow.`,
              ctaLabel: 'View Batches',
              ctaUrl: '/teacher/batches',
              entityType: 'enrollment',
              entityId: `batch-${t._id}-${i}`,
            });
            result.batchReminders++;
          }
        } catch (err) {
          result.errors.push(String(err));
        }
      }
    }
  }

  // 3. Payment reminder for parents (enrollment ending in 7 days)
  const start7 = new Date(now);
  start7.setDate(start7.getDate() + 7);
  start7.setHours(0, 0, 0, 0);
  const end7 = new Date(start7);
  end7.setHours(23, 59, 59, 999);

  const endingEnrollments = await Enrollment.find({
    status: 'active',
    endDate: { $gte: start7, $lte: end7 },
  })
    .populate('studentId', 'parentId name')
    .populate('teacherId', 'name')
    .lean();

  const seenPaymentParents = new Set<string>();
  for (const e of endingEnrollments) {
    const student = e.studentId as { parentId?: mongoose.Types.ObjectId; name?: string } | null;
    if (!student?.parentId) continue;
    const parent = await Parent.findById(student.parentId).select('userId').lean();
    if (!parent?.userId) continue;
    const key = `${e._id}-${parent.userId}`;
    if (seenPaymentParents.has(key)) continue;
    seenPaymentParents.add(key);
    try {
      const existing = await Notification.findOne({
        userId: parent.userId,
        type: 'payment_reminder',
        entityId: String(e._id),
        createdAt: { $gte: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) },
      });
      if (!existing) {
        await createNotification({
          userId: parent.userId as mongoose.Types.ObjectId,
          type: 'payment_reminder',
          title: 'Payment reminder',
          message: `Tuition for ${student.name || 'your child'} (${e.subject}) is ending soon. Renew to continue classes.`,
          ctaLabel: 'Renew Now',
          ctaUrl: '/parent/dashboard',
          entityType: 'payment',
          entityId: String(e._id),
          metadata: { endDate: e.endDate, subject: e.subject },
        });
        result.paymentReminders++;
      }
    } catch (err) {
      result.errors.push(String(err));
    }
  }

  // 4. Review reminder for parents (unreviewed teachers, weekly)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const enrollmentsForReview = await Enrollment.find({
    status: 'active',
    paymentStatus: 'completed',
    startDate: { $lte: sevenDaysAgo },
  })
    .populate('studentId', 'parentId')
    .populate('teacherId', 'name')
    .lean();

  const reviewedPairs = new Set<string>();
  const reviews = await TeacherReview.find({}).select('parentId teacherId').lean();
  for (const r of reviews) {
    reviewedPairs.add(`${(r.parentId as mongoose.Types.ObjectId)?.toString()}-${(r.teacherId as mongoose.Types.ObjectId)?.toString()}`);
  }

  const seenReviewReminder = new Set<string>();
  for (const e of enrollmentsForReview) {
    const student = e.studentId as { parentId?: mongoose.Types.ObjectId } | null;
    if (!student?.parentId) continue;
    const parent = await Parent.findById(student.parentId).select('userId').lean();
    if (!parent?.userId) continue;
    const teacherId = (e.teacherId as { _id?: mongoose.Types.ObjectId })?._id;
    if (!teacherId) continue;
    const key = `${parent._id}-${teacherId}`;
    if (reviewedPairs.has(key) || seenReviewReminder.has(key)) continue;
    seenReviewReminder.add(key);
    try {
      const existing = await Notification.findOne({
        userId: parent.userId,
        type: 'review_reminder',
        entityId: `review-${parent._id}-${teacherId}`,
        createdAt: { $gte: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) },
      });
      if (!existing) {
        const teacherName = (e.teacherId as { name?: string })?.name || 'your teacher';
        await createNotification({
          userId: parent.userId as mongoose.Types.ObjectId,
          type: 'review_reminder',
          title: 'Share your feedback',
          message: `How was your experience with ${teacherName}? Your review helps other parents.`,
          ctaLabel: 'My Teachers',
          ctaUrl: '/parent/my-teachers',
          entityType: 'enrollment',
          entityId: `review-${parent._id}-${teacherId}`,
          metadata: { teacherId: String(teacherId), teacherName },
        });
        result.reviewReminders++;
      }
    } catch (err) {
      result.errors.push(String(err));
    }
  }

  return result;
}
