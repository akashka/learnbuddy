import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { TeacherReview } from '@/lib/models/TeacherReview';
import { getBatchOccupiedSeatCount, shouldHideBatchFromParents } from '@/lib/batch-seat-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const teacher = await Teacher.findById(id)
      .select('-phone -__v')
      .lean();

    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (teacher.status !== 'qualified') return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const reviews = await TeacherReview.find({ teacherId: id })
      .populate('parentId', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const avgResult = await TeacherReview.aggregate([
      { $match: { teacherId: teacher._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const avgRating = avgResult[0]?.avg ? Math.round(avgResult[0].avg * 10) / 10 : null;
    const reviewCount = avgResult[0]?.count || 0;

    const rawBatches = teacher.batches || [];
    const batches = await Promise.all(
      rawBatches.map(async (b: Record<string, unknown>, index: number) => {
        const batchName = String(b.name || '');
        const maxStudents = typeof b.maxStudents === 'number' ? b.maxStudents : 3;
        let enrolledCount = 0;
        if (batchName) {
          enrolledCount = await getBatchOccupiedSeatCount(teacher._id, index, batchName);
        }
        const hideFromParents = shouldHideBatchFromParents(
          {
            isActive: b.isActive as boolean | undefined,
            enrollmentOpen: b.enrollmentOpen as boolean | undefined,
            startDate: b.startDate as Date | string | undefined,
            maxStudents,
          },
          enrolledCount,
          maxStudents
        );
        return {
          ...b,
          batchIndex: index,
          enrolledCount,
          maxStudents,
          hideFromParents,
        };
      })
    );

    return NextResponse.json({
      ...teacher,
      averageRating: avgRating,
      reviewCount,
      reviews: reviews.map((r) => ({
        rating: r.rating,
        review: (r as { reviewDisplay?: string }).reviewDisplay ?? r.review,
        parentName: (r.parentId as { name?: string })?.name || 'Parent',
        createdAt: r.createdAt,
      })),
      batches,
    });
  } catch (error) {
    console.error('Teacher detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
