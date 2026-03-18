import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher, User, TeacherReview, TeacherPayment, Enrollment } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const teacher = await Teacher.findById(id)
      .populate('userId', 'email isActive deactivationReason deactivatedAt')
      .populate('bgvApprovedBy', 'email')
      .lean();

    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const [reviews, payments, enrollments] = await Promise.all([
      TeacherReview.find({ teacherId: id })
        .populate('parentId', 'name')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      TeacherPayment.find({ teacherId: id }).sort({ createdAt: -1 }).limit(100).lean(),
      Enrollment.find({ teacherId: id })
        .populate('studentId', 'name studentId')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const avgResult = await TeacherReview.aggregate([
      { $match: { teacherId: teacher._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const averageRating = avgResult[0]?.avg ? Math.round(avgResult[0].avg * 10) / 10 : null;
    const reviewCount = avgResult[0]?.count || 0;

    const batches = (teacher.batches || []) as { name: string; subject: string; board: string; classLevel: string; feePerMonth: number; slots: { day: string; startTime: string; endTime: string }[]; minStudents: number; maxStudents: number; isActive?: boolean }[];
    const batchesWithEnrollments = batches.map((batch, idx) => {
      const batchEnrollments = enrollments.filter(
        (e: { batchId?: string }) => e.batchId === batch.name
      );
      return {
        ...batch,
        batchIndex: idx,
        enrolledCount: batchEnrollments.length,
        students: (batchEnrollments as unknown as Record<string, unknown>[]).map((e) => ({
          _id: (e.studentId as { _id?: unknown })?._id,
          name: (e.studentId as { name?: string })?.name,
          studentId: (e.studentId as { studentId?: string })?.studentId,
          paymentStatus: e.paymentStatus,
          totalAmount: e.totalAmount,
          duration: e.duration,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
      };
    });

    return NextResponse.json({
      ...teacher,
      averageRating,
      reviewCount,
      reviews: (reviews as unknown as Record<string, unknown>[]).map((r) => ({
        rating: r.rating,
        review: r.reviewDisplay ?? r.review,
        parentName: (r.parentId as { name?: string } | undefined)?.name || 'Parent',
        createdAt: r.createdAt,
      })),
      payments: payments.map((p: { amount: number; description?: string; periodStart?: Date; periodEnd?: Date; status: string; paidAt?: Date; createdAt: Date }) => ({
        amount: p.amount,
        description: p.description,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        status: p.status,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
      batchesWithEnrollments,
    });
  } catch (error) {
    console.error('Admin teacher detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
