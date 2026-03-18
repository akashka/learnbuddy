import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher, Parent, Student, Enrollment, DiscountCode } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - Marketing & Sales: acquisition funnel, conversion, discount usage */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') || '30', 10)));

    await connectDB();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Acquisition funnel: new signups
    const [newTeachers, newParents, newStudents] = await Promise.all([
      Teacher.countDocuments({ createdAt: { $gte: startDate } }),
      Parent.countDocuments({ createdAt: { $gte: startDate } }),
      Student.countDocuments({ createdAt: { $gte: startDate } }),
    ]);

    // New enrollments (conversions)
    const newEnrollments = await Enrollment.countDocuments({
      paymentStatus: 'completed',
      createdAt: { $gte: startDate },
    });

    // Conversion rate: enrollments / (parents or students - use students as primary)
    const totalStudents = await Student.countDocuments();
    const totalParents = await Parent.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments({ paymentStatus: 'completed' });
    const conversionRate = totalStudents > 0 ? Math.round((totalEnrollments / totalStudents) * 100) : 0;

    // Discount code usage
    const discountRedemptions = await Enrollment.aggregate([
      { $match: { paymentStatus: 'completed', discountCodeId: { $exists: true, $ne: null } } },
      { $group: { _id: '$discountCodeId', count: { $sum: 1 }, amount: { $sum: '$discountCodeAmount' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const discountCodes = await DiscountCode.find({ _id: { $in: discountRedemptions.map((d) => d._id) } })
      .select('code type value')
      .lean();

    const codeMap = Object.fromEntries((discountCodes as { _id: unknown; code?: string }[]).map((c) => [String(c._id), c.code || 'Unknown']));

    const discountUsage = discountRedemptions.map((d) => ({
      code: codeMap[String(d._id)] || 'Unknown',
      redemptions: d.count,
      totalDiscount: d.amount,
    }));

    // Signups by day
    const signupsByDay = await Teacher.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, teachers: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const parentsByDay = await Parent.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, parents: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const enrollmentsByDay = await Enrollment.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, enrollments: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const dateSet = new Set([
      ...signupsByDay.map((d) => d._id),
      ...parentsByDay.map((d) => d._id),
      ...enrollmentsByDay.map((d) => d._id),
    ]);
    const allDates = Array.from(dateSet).sort();
    const signupMap = Object.fromEntries(signupsByDay.map((d) => [d._id, d.teachers]));
    const parentMap = Object.fromEntries(parentsByDay.map((d) => [d._id, d.parents]));
    const enrollMap = Object.fromEntries(enrollmentsByDay.map((d) => [d._id, d.enrollments]));

    const funnelByDay = allDates.map((date) => ({
      date,
      teachers: signupMap[date] ?? 0,
      parents: parentMap[date] ?? 0,
      enrollments: enrollMap[date] ?? 0,
    }));

    return NextResponse.json({
      periodDays: days,
      funnel: {
        newTeachers,
        newParents,
        newStudents,
        newEnrollments,
        conversionRate,
      },
      discountUsage,
      funnelByDay,
    });
  } catch (error) {
    console.error('Marketing report error:', error);
    return NextResponse.json({ error: 'Failed to fetch marketing report' }, { status: 500 });
  }
}
