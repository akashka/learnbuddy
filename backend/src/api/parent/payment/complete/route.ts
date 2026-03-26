import mongoose from 'mongoose';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { Enrollment } from '@/lib/models/Enrollment';
import { Teacher } from '@/lib/models/Teacher';
import { Parent } from '@/lib/models/Parent';
import { getAuthFromRequest } from '@/lib/auth';
import { finalizePendingEnrollment } from '@/lib/finalize-pending-enrollment';

export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { pendingId } = (await request.json()) as any;

    if (!pendingId) {
      return NextResponse.json({ error: 'Pending ID required' }, { status: 400 });
    }

    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pending = await PendingEnrollment.findOne({ _id: pendingId, parentId: parent._id }).populate('teacherId');
    if (!pending) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (pending.paymentStatus === 'completed') {
      return NextResponse.json({ error: 'This enrollment is already paid.' }, { status: 400 });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    let paymentId: string;

    try {
      const teacherObj = pending.teacherId as { _id?: any; name?: string; batches?: { name?: string; maxStudents?: number; subject?: string }[] };
      const teacherId = teacherObj._id || pending.teacherId;

      await Teacher.findOneAndUpdate(
        { _id: teacherId },
        { $set: { updatedAt: new Date() } },
        { session, new: true }
      );

      const batch = teacherObj?.batches?.[pending.batchIndex];
      if (batch) {
        const maxStudents = batch.maxStudents ?? 3;
        const enrolledCount = await Enrollment.countDocuments({
          teacherId: teacherId,
          batchId: batch.name,
          status: 'active',
        }).session(session);
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
        const blockedCount = await PendingEnrollment.countDocuments({
          teacherId: teacherId,
          batchIndex: pending.batchIndex,
          _id: { $ne: pendingId },
          $or: [
            { paymentStatus: 'completed', convertedToEnrollmentId: null },
            { paymentStatus: 'pending', createdAt: { $gte: fifteenMinAgo } },
          ],
        }).session(session);
        if (enrolledCount + blockedCount >= maxStudents) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({ error: 'Batch is full. Seat was taken while you were completing payment.' }, { status: 400 });
        }
      }

      paymentId = `pay_${Date.now()}`;
      await PendingEnrollment.findByIdAndUpdate(pendingId, {
        paymentStatus: 'completed',
        paymentId,
      }, { session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      console.error('Transaction error in payment complete:', err);
      return NextResponse.json({ error: 'Failed to reserve seat due to concurrent transactions.' }, { status: 500 });
    } finally {
      session.endSession();
    }

    let finalizeResult: Awaited<ReturnType<typeof finalizePendingEnrollment>>;
    try {
      finalizeResult = await finalizePendingEnrollment({
        pendingId: String(pendingId),
        parentUserId: decoded.userId,
      });
    } catch (e) {
      await PendingEnrollment.findByIdAndUpdate(pendingId, {
        paymentStatus: 'pending',
        $unset: { paymentId: 1 },
      });
      const msg = e instanceof Error ? e.message : 'Could not create enrollment after payment.';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const fresh = await PendingEnrollment.findById(pendingId)
      .populate('teacherId', 'name batches')
      .lean();
    const t = fresh?.teacherId as { name?: string; batches?: { name?: string }[] } | null;
    const batchIdx = fresh?.batchIndex ?? 0;
    const receiptBatch = t?.batches?.[batchIdx];
    const paidAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      receipt: {
        paymentId,
        paidAt,
        pendingEnrollmentId: String(pendingId),
        enrollmentId: finalizeResult.enrollmentId,
        studentMongoId: finalizeResult.studentMongoId,
        studentDisplayId: finalizeResult.studentDisplayId,
        subject: fresh?.subject,
        teacherName: t?.name,
        batchName: receiptBatch?.name,
        board: fresh?.board,
        classLevel: fresh?.classLevel,
        duration: fresh?.duration,
        feePerMonth: fresh?.feePerMonth,
        discount: fresh?.discount,
        discountCode: fresh?.discountCode,
        discountCodeAmount: fresh?.discountCodeAmount,
        totalAmount: fresh?.totalAmount,
        slots: fresh?.slots,
      },
    });
  } catch (error) {
    console.error('Payment complete error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
