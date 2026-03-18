import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { User, Teacher, Parent, Student, Enrollment, TeacherReview } from '@/lib/models';
import { ClassSession } from '@/lib/models/ClassSession';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - Executive overview for investors: key metrics, growth, health */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Core counts
    const [teachers, parents, students, enrollments, activeEnrollments] = await Promise.all([
      Teacher.countDocuments({ status: 'qualified' }),
      Parent.countDocuments(),
      Student.countDocuments(),
      Enrollment.countDocuments({ paymentStatus: 'completed' }),
      Enrollment.countDocuments({ paymentStatus: 'completed', status: 'active' }),
    ]);

    // Revenue
    const revenueResult = await Enrollment.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total ?? 0;

    const revenueLast30 = await Enrollment.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const revenue30 = revenueLast30[0]?.total ?? 0;

    const revenuePrev30 = await Enrollment.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const revenuePrev = revenuePrev30[0]?.total ?? 0;
    const revenueGrowth = revenuePrev > 0 ? Math.round(((revenue30 - revenuePrev) / revenuePrev) * 100) : (revenue30 > 0 ? 100 : 0);

    // New users (last 30 days)
    const [newTeachers, newParents, newStudents, newEnrollments] = await Promise.all([
      Teacher.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Parent.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Student.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Enrollment.countDocuments({ paymentStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    // Class completion rate
    const [scheduledClasses, completedClasses] = await Promise.all([
      ClassSession.countDocuments({ scheduledAt: { $gte: thirtyDaysAgo } }),
      ClassSession.countDocuments({ status: 'completed', scheduledAt: { $gte: thirtyDaysAgo } }),
    ]);
    const completionRate = scheduledClasses > 0 ? Math.round((completedClasses / scheduledClasses) * 100) : 0;

    // Avg teacher rating
    const avgRatingResult = await TeacherReview.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const avgRating = avgRatingResult[0] ? Math.round(avgRatingResult[0].avg * 10) / 10 : null;
    const totalReviews = avgRatingResult[0]?.count ?? 0;

    // Enrollments by day (last 30)
    const enrollmentsByDay = await Enrollment.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      metrics: {
        teachers,
        parents,
        students,
        enrollments,
        activeEnrollments,
        totalRevenue,
        revenueLast30Days: revenue30,
        revenueGrowthPercent: revenueGrowth,
        newTeachersLast30: newTeachers,
        newParentsLast30: newParents,
        newStudentsLast30: newStudents,
        newEnrollmentsLast30: newEnrollments,
        classCompletionRate: completionRate,
        avgTeacherRating: avgRating,
        totalReviews,
      },
      enrollmentsByDay: enrollmentsByDay.map((d) => ({ date: d._id, count: d.count })),
    });
  } catch (error) {
    console.error('Reports overview error:', error);
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 });
  }
}
