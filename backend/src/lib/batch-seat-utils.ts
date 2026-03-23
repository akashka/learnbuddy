import mongoose from 'mongoose';
import { Enrollment } from '@/lib/models/Enrollment';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';

/** Active enrollments + seats reserved by pending/completed-unconverted (same logic as checkout). */
export async function getBatchOccupiedSeatCount(
  teacherId: mongoose.Types.ObjectId,
  batchIndex: number,
  batchName: string
): Promise<number> {
  const activeEnrollments = await Enrollment.countDocuments({
    teacherId,
    batchId: batchName,
    status: 'active',
  });
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  const blockedPending = await PendingEnrollment.countDocuments({
    teacherId,
    batchIndex,
    $or: [
      { paymentStatus: 'completed', convertedToEnrollmentId: null },
      { paymentStatus: 'pending', createdAt: { $gte: fifteenMinAgo } },
    ],
  });
  return activeEnrollments + blockedPending;
}

export type BatchLike = {
  isActive?: boolean;
  enrollmentOpen?: boolean;
  startDate?: Date | string | null;
  maxStudents?: number;
};

/**
 * Hide batch from parent marketplace / profile / checkout when full, closed, inactive,
 * or batch start is on or before (today + 7 calendar days).
 */
export function shouldHideBatchFromParents(
  batch: BatchLike,
  occupiedSeats: number,
  maxStudents: number
): boolean {
  console.log('shouldHideBatchFromParents', batch, occupiedSeats, maxStudents);
  if (batch.isActive === false) return true;
  if (batch.enrollmentOpen === false) return true;
  if (occupiedSeats >= maxStudents) return true;
  // if (batch.startDate) {
  //   const start = new Date(batch.startDate);
  //   if (!isNaN(start.getTime())) {
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);
  //     const limit = new Date(today);
  //     limit.setDate(limit.getDate() + 7);
  //     start.setHours(0, 0, 0, 0);
  //     if (start.getTime() <= limit.getTime()) return true;
  //   }
  // }
  return false;
}
