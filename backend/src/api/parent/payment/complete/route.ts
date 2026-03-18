import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { Enrollment } from '@/lib/models/Enrollment';
import { Teacher } from '@/lib/models/Teacher';
import { Parent } from '@/lib/models/Parent';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { pendingId } = await request.json();

    if (!pendingId) {
      return NextResponse.json({ error: 'Pending ID required' }, { status: 400 });
    }

    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pending = await PendingEnrollment.findOne({ _id: pendingId, parentId: parent._id }).populate('teacherId');
    if (!pending) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const teacher = pending.teacherId as { batches?: { name?: string; maxStudents?: number }[] };
    const batch = teacher?.batches?.[pending.batchIndex];
    if (batch) {
      const maxStudents = batch.maxStudents ?? 3;
      const enrolledCount = await Enrollment.countDocuments({
        teacherId: pending.teacherId,
        batchId: batch.name,
        status: 'active',
      });
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
      const blockedCount = await PendingEnrollment.countDocuments({
        teacherId: pending.teacherId,
        batchIndex: pending.batchIndex,
        _id: { $ne: pendingId },
        $or: [
          { paymentStatus: 'completed', convertedToEnrollmentId: null },
          { paymentStatus: 'pending', createdAt: { $gte: fifteenMinAgo } },
        ],
      });
      if (enrolledCount + blockedCount >= maxStudents) {
        return NextResponse.json({ error: 'Batch is full. Seat was taken while you were completing payment.' }, { status: 400 });
      }
    }

    await PendingEnrollment.findByIdAndUpdate(pendingId, {
      paymentStatus: 'completed',
      paymentId: `pay_${Date.now()}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment complete error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
