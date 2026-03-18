/**
 * Generate ClassSessions for the next 7 days.
 * - Groups enrollments by (teacherId, batchId, slot)
 * - Batch start date: from Teacher.batches[].startDate or today
 * - Only if next 7 days is within batch start range
 * - Payment must be completed, endDate >= now + 7 days (next payment outside 7 days)
 * - Creates 1 ClassSession per batch slot with 1-3 students, 1-3 parents, 1 teacher
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Enrollment } from '@/lib/models/Enrollment';
import { ClassSession } from '@/lib/models/ClassSession';
import { Teacher } from '@/lib/models/Teacher';
import { Student } from '@/lib/models/Student';
import { getDatesForSlot, getSlotDurationMinutes } from '@/lib/schedule-utils';
import type { Slot } from '@/lib/schedule-utils';

function slotKey(slot: Slot): string {
  return `${slot.day}|${slot.startTime}|${slot.endTime}`;
}

export interface GenerateResult {
  created: number;
  skipped: number;
  errors: string[];
  /** Optional: enrollment groups found (for debugging) */
  groupsFound?: number;
  /** Optional: total slots considered (for debugging) */
  slotsConsidered?: number;
}

export async function generateClassSchedules(weeks = 7): Promise<GenerateResult> {
  const result: GenerateResult = { created: 0, skipped: 0, errors: [] };

  await connectDB();

  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(fromDate);
  toDate.setDate(toDate.getDate() + weeks);
  toDate.setHours(23, 59, 59, 999);

  const teachers = await Teacher.find({ status: 'qualified' }).lean();
  const teacherMap = new Map<string, { batches: { name: string; startDate?: Date }[] }>();
  teachers.forEach((t) => teacherMap.set(String(t._id), { batches: t.batches || [] }));

  const enrollments = await Enrollment.find({
    status: 'active',
    paymentStatus: 'completed',
    endDate: { $gte: toDate },
  })
    .lean();

  if (enrollments.length === 0) {
    result.errors.push('No active enrollments with completed payment and endDate >= ' + toDate.toISOString());
    return result;
  }

  const grouped = new Map<string, typeof enrollments>();
  for (const e of enrollments) {
    const batchStart = getBatchStartDate(e, teacherMap);
    if (batchStart > fromDate) continue;
    const slots = (e.slots || []) as Slot[];
    for (const slot of slots) {
      const key = `${e.teacherId}|${e.batchId}|${slotKey(slot)}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(e);
    }
  }

  result.groupsFound = grouped.size;
  let slotsConsidered = 0;

  for (const [key, groupEnrollments] of grouped) {
    if (groupEnrollments.length === 0 || groupEnrollments.length > 3) continue;
    const parts = key.split('|');
    const slot: Slot = {
      day: parts[2] || 'Mon',
      startTime: parts[3] || '10:00',
      endTime: parts[4] || '11:00',
    };
    const first = groupEnrollments[0];
    const teacherId = first.teacherId;
    const batchId = first.batchId;
    const subject = first.subject;
    const board = first.board;
    const classLevel = first.classLevel;

    const studentIds: mongoose.Types.ObjectId[] = [];
    const seen = new Set<string>();
    for (const e of groupEnrollments) {
      const sid = e.studentId;
      if (!sid) continue;
      const oid = sid instanceof mongoose.Types.ObjectId ? sid : new mongoose.Types.ObjectId(String(sid));
      const str = oid.toString();
      if (!seen.has(str)) {
        seen.add(str);
        studentIds.push(oid);
      }
    }
    if (studentIds.length === 0) {
      result.errors.push(`No valid studentIds for group ${key}`);
      continue;
    }
    const parentIds: mongoose.Types.ObjectId[] = [];
    const students = await Student.find({ _id: { $in: studentIds } }).select('parentId').lean();
    const seenParents = new Set<string>();
    for (const s of students) {
      if (s.parentId && !seenParents.has(String(s.parentId))) {
        seenParents.add(String(s.parentId));
        parentIds.push(s.parentId as mongoose.Types.ObjectId);
      }
    }
    const enrollmentIds = groupEnrollments.map((e) => e._id);

    const dates = getDatesForSlot(slot, fromDate, toDate);
    const duration = getSlotDurationMinutes(slot);

    for (const scheduledAt of dates) {
      slotsConsidered++;
      const existing = await ClassSession.findOne({
        teacherId,
        batchId,
        scheduledAt: { $gte: new Date(scheduledAt.getTime() - 60000), $lte: new Date(scheduledAt.getTime() + 60000) },
        status: { $in: ['scheduled', 'in_progress'] },
      });
      if (existing) {
        result.skipped++;
        continue;
      }

      try {
        await ClassSession.create({
          teacherId,
          batchId,
          subject,
          board,
          classLevel,
          studentIds,
          parentIds,
          enrollmentIds,
          scheduledAt,
          duration,
          status: 'scheduled',
          aiMonitoringAlerts: [],
        });
        result.created++;
      } catch (err) {
        result.errors.push(String(err));
      }
    }
  }

  result.slotsConsidered = slotsConsidered;
  return result;
}

function getBatchStartDate(
  enrollment: { teacherId: unknown; batchId?: string; startDate?: Date },
  teacherMap: Map<string, { batches: { name: string; startDate?: Date }[] }>
): Date {
  const teacher = teacherMap.get(String(enrollment.teacherId));
  const batch = teacher?.batches?.find((b) => b.name === enrollment.batchId);
  if (batch?.startDate) return new Date(batch.startDate);
  if (enrollment.startDate) return new Date(enrollment.startDate);
  return new Date();
}
