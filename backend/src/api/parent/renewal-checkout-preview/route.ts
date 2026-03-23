import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Enrollment } from '@/lib/models/Enrollment';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

const DISCOUNTS: Record<string, number> = { '3months': 0, '6months': 5, '12months': 10 };

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId required' }, { status: 400 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      studentId: { $in: parent.children },
      paymentStatus: 'completed',
      status: 'active',
    }).lean();

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found or not eligible for renewal' }, { status: 404 });
    }

    const teacher = await Teacher.findById(enrollment.teacherId).lean();
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const batches = teacher.batches || [];
    const batchIndex = batches.findIndex((b) => (b.name || '') === (enrollment.batchId || ''));
    if (batchIndex < 0) {
      return NextResponse.json({ error: 'Batch no longer linked to this enrollment' }, { status: 400 });
    }
    const batch = batches[batchIndex];

    const duration =
      enrollment.duration === '6months' || enrollment.duration === '12months'
        ? enrollment.duration
        : '3months';
    const months = duration === '3months' ? 3 : duration === '6months' ? 6 : 12;
    const discPct = DISCOUNTS[duration] ?? 0;
    const fee = batch.feePerMonth ?? enrollment.feePerMonth ?? 0;
    const baseAfterDuration = Math.round(fee * months * (1 - discPct / 100));

    const periodEnd = enrollment.endDate ? new Date(enrollment.endDate) : null;
    const extensionEnd = periodEnd
      ? (() => {
          const d = new Date(periodEnd);
          d.setMonth(d.getMonth() + months);
          return d.toISOString();
        })()
      : null;

    return NextResponse.json({
      renewalEnrollmentId: String(enrollment._id),
      teacherId: String(teacher._id),
      batchIndex,
      duration,
      months,
      discountPercent: discPct,
      feePerMonth: fee,
      baseAfterDuration,
      subject: enrollment.subject,
      board: enrollment.board,
      classLevel: enrollment.classLevel,
      batchId: enrollment.batchId,
      slots: enrollment.slots,
      currentPeriodEnd: enrollment.endDate,
      extendedPeriodEnd: extensionEnd,
      studentId: String(enrollment.studentId),
      teacher: {
        _id: String(teacher._id),
        name: teacher.name,
        photoUrl: teacher.photoUrl,
        batches: teacher.batches,
      },
    });
  } catch (error) {
    console.error('renewal-checkout-preview error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
