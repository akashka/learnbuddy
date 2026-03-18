import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher, TeacherReview, Enrollment, TeacherPayment } from '@/lib/models';
import { ClassSession } from '@/lib/models/ClassSession';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - Teacher performance: ratings, completion rate, revenue */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const sortBy = searchParams.get('sort') || 'revenue';
    const order = searchParams.get('order') === 'asc' ? 1 : -1;

    await connectDB();

    const teachers = await Teacher.find({ status: 'qualified' })
      .populate('userId', 'email')
      .select('name _id')
      .limit(500)
      .lean();

    const performance = await Promise.all(
      teachers.map(async (t) => {
        const teacherId = t._id;

        // Ratings from TeacherReview
        const reviews = await TeacherReview.find({ teacherId }).lean();
        const avgRating = reviews.length > 0
          ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
          : null;
        const reviewCount = reviews.length;

        // Class completion: completed vs scheduled (last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const [scheduledCount, completedCount] = await Promise.all([
          ClassSession.countDocuments({ teacherId, scheduledAt: { $gte: ninetyDaysAgo } }),
          ClassSession.countDocuments({ teacherId, status: 'completed', scheduledAt: { $gte: ninetyDaysAgo } }),
        ]);
        const completionRate = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : null;

        // Revenue from enrollments (completed payments)
        const revenueResult = await Enrollment.aggregate([
          { $match: { teacherId, paymentStatus: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        const revenue = revenueResult[0]?.total ?? 0;

        // Active enrollments
        const activeEnrollments = await Enrollment.countDocuments({ teacherId, status: 'active' });

        return {
          teacherId: String(teacherId),
          teacherName: (t as { name?: string }).name || 'Unknown',
          avgRating,
          reviewCount,
          completionRate,
          scheduledClasses: scheduledCount,
          completedClasses: completedCount,
          revenue,
          activeEnrollments,
        };
      })
    );

    // Sort
    const sortKey = sortBy === 'rating' ? 'avgRating' : sortBy === 'completion' ? 'completionRate' : 'revenue';
    performance.sort((a, b) => {
      const va = (a as Record<string, unknown>)[sortKey] ?? 0;
      const vb = (b as Record<string, unknown>)[sortKey] ?? 0;
      return order === 1 ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    const topPerformers = performance.slice(0, limit);

    // Summary stats
    const withRatings = performance.filter((p) => p.avgRating != null);
    const avgRatingAll = withRatings.length > 0
      ? Math.round((withRatings.reduce((a, p) => a + (p.avgRating ?? 0), 0) / withRatings.length) * 10) / 10
      : null;
    const totalRevenue = performance.reduce((a, p) => a + p.revenue, 0);
    const withCompletion = performance.filter((p) => p.completionRate != null);
    const avgCompletion = withCompletion.length > 0
      ? Math.round(withCompletion.reduce((a, p) => a + (p.completionRate ?? 0), 0) / withCompletion.length)
      : null;

    return NextResponse.json({
      teachers: topPerformers,
      summary: {
        totalTeachers: performance.length,
        avgRating: avgRatingAll,
        totalRevenue,
        avgCompletionRate: avgCompletion,
      },
    });
  } catch (error) {
    console.error('Teacher performance report error:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher performance' }, { status: 500 });
  }
}
