import connectDB from '@/lib/db';
import { Enrollment } from '@/lib/models/Enrollment';
import { ClassSession } from '@/lib/models/ClassSession';
import { Student } from '@/lib/models/Student';
import { Teacher } from '@/lib/models/Teacher';
import { getDatesForSlot, getSlotDurationMinutes, Slot } from '@/lib/schedule-utils';
import mongoose from 'mongoose';

export async function processEnrollmentConfirmation(data: { enrollmentId: string }) {
  const { enrollmentId } = data;
  if (!enrollmentId) {
    throw new Error('enrollmentId is required');
  }

  await connectDB();

  const enrollment = await Enrollment.findById(enrollmentId).lean();
  if (!enrollment) {
    throw new Error(`Enrollment not found for id: ${enrollmentId}`);
  }

  if (enrollment.status !== 'active' || enrollment.paymentStatus !== 'completed') {
    throw new Error(`Enrollment ${enrollmentId} is not active or payment not completed`);
  }

  const { teacherId, batchId, startDate, endDate, slots, studentId, subject, board, classLevel } = enrollment;

  if (!startDate || !endDate || !slots || !Array.isArray(slots) || slots.length === 0) {
    console.warn(`[Enrollment Confirm Job] Enrollment ${enrollmentId} missing dates or slots. Skipping schedule generation.`);
    return;
  }

  const student = await Student.findById(studentId).select('parentId').lean();
  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const parentIds = student.parentId ? [student.parentId as mongoose.Types.ObjectId] : [];
  const sId = typeof studentId === 'string' ? new mongoose.Types.ObjectId(studentId) : (studentId as mongoose.Types.ObjectId);

  let createdCount = 0;
  let skippedCount = 0;

  for (const slotObj of slots) {
    const slot = slotObj as Slot;
    const dates = getDatesForSlot(slot, new Date(startDate), new Date(endDate));
    const duration = getSlotDurationMinutes(slot);

    for (const scheduledAt of dates) {
      // Check if a schedule already exists for this slot (teacher + batch + time)
      const existing = await ClassSession.findOne({
        teacherId,
        batchId,
        scheduledAt: {
          $gte: new Date(scheduledAt.getTime() - 60000),
          $lte: new Date(scheduledAt.getTime() + 60000),
        },
        status: { $in: ['scheduled', 'in_progress'] },
      });

      if (existing) {
        // If it exists, ensure this student/enrollment is added to it
        if (!existing.studentIds?.map(id => id.toString()).includes(sId.toString())) {
          await ClassSession.findByIdAndUpdate(existing._id, {
            $addToSet: {
              studentIds: sId,
              parentIds: { $each: parentIds },
              enrollmentIds: new mongoose.Types.ObjectId(enrollmentId),
            }
          });
        }
        skippedCount++;
        continue;
      }

      // Create a new session
      await ClassSession.create({
        teacherId,
        batchId,
        subject,
        board,
        classLevel,
        studentIds: [sId],
        parentIds,
        enrollmentIds: [new mongoose.Types.ObjectId(enrollmentId)],
        scheduledAt,
        duration,
        status: 'scheduled',
        aiMonitoringAlerts: [],
      });
      createdCount++;
    }
  }

  console.log(`[Enrollment Confirm Job] Processed enrollment ${enrollmentId}: created ${createdCount} sessions, updated/skipped ${skippedCount} sessions.`);
}
