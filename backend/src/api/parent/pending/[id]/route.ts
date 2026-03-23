import mongoose from 'mongoose';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { Parent } from '@/lib/models/Parent';
import { Enrollment } from '@/lib/models/Enrollment';
import { Student } from '@/lib/models/Student';
import { getAuthFromRequest } from '@/lib/auth';
import { getBatchOccupiedSeatCount } from '@/lib/batch-seat-utils';

/** GET - Get single pending enrollment for parent (for payment page) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pending = await PendingEnrollment.findOne({
      _id: id,
      parentId: parent._id,
    })
      .populate('teacherId', 'name batches')
      .lean();

    if (!pending) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const teacher = pending.teacherId as {
      _id?: unknown;
      name?: string;
      batches?: { name?: string; subject?: string; maxStudents?: number }[];
    } | null;
    const batchIdx = pending.batchIndex ?? 0;
    const batch = teacher?.batches?.[batchIdx];
    const teacherOid = teacher?._id as mongoose.Types.ObjectId | undefined;
    const batchNameForSeat = batch?.name || '';
    const batchMaxStudents = typeof batch?.maxStudents === 'number' ? batch.maxStudents : 3;
    let batchEnrolledCount = 0;
    if (teacherOid && batchNameForSeat) {
      batchEnrolledCount = await getBatchOccupiedSeatCount(teacherOid, batchIdx, batchNameForSeat);
    }

    let enrollmentId: string | undefined;
    let studentMongoId: string | undefined;
    let studentDisplayId: string | undefined;
    if (pending.convertedToEnrollmentId) {
      const enr = await Enrollment.findById(pending.convertedToEnrollmentId).lean();
      if (enr?.studentId) {
        enrollmentId = String(enr._id);
        studentMongoId = String(enr.studentId);
        const stu = await Student.findById(enr.studentId).lean();
        studentDisplayId = stu?.studentId || studentMongoId;
      }
    }

    return NextResponse.json({
      _id: pending._id,
      subject: pending.subject,
      totalAmount: pending.totalAmount,
      paymentStatus: pending.paymentStatus,
      paymentId: pending.paymentId,
      enrollmentId,
      studentMongoId,
      studentDisplayId,
      teacherName: teacher?.name,
      batchName: batch?.name,
      batchEnrolledCount,
      batchMaxStudents,
      board: pending.board,
      classLevel: pending.classLevel,
      duration: pending.duration,
      feePerMonth: pending.feePerMonth,
      discount: pending.discount,
      discountCode: pending.discountCode,
      discountCodeAmount: pending.discountCodeAmount,
      slots: pending.slots,
      createdAt: pending.createdAt,
      updatedAt: pending.updatedAt,
    });
  } catch (error) {
    console.error('Pending get error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
