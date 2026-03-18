import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import {
  User,
  Teacher,
  Parent,
  Student,
  Enrollment,
  TeacherPayment,
  PendingEnrollment,
} from '@/lib/models';
import { ClassSession } from '@/lib/models/ClassSession';
import { AIReviewRequest } from '@/lib/models/AIReviewRequest';
import { SecurityIncident } from '@/lib/models/SecurityIncident';
import { AIUsageLog } from '@/lib/models/AIUsageLog';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - Platform metrics for admin dashboard */
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

    // Counts
    const [
      teachersCount,
      parentsCount,
      studentsCount,
      enrollmentsTotal,
      enrollmentsActive,
      pendingEnrollmentsCount,
      pendingAiReviewsCount,
      openSecurityIncidentsCount,
    ] = await Promise.all([
      Teacher.countDocuments(),
      Parent.countDocuments(),
      Student.countDocuments(),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ status: 'active' }),
      PendingEnrollment.countDocuments(),
      AIReviewRequest.countDocuments({ status: { $in: ['pending', 'in_review'] } }),
      SecurityIncident.countDocuments({ status: 'open' }),
    ]);

    // Revenue: sum of completed enrollments totalAmount
    const revenueResult = await Enrollment.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total ?? 0;

    // Revenue this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenueThisMonthResult = await Enrollment.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const revenueThisMonth = revenueThisMonthResult[0]?.total ?? 0;

    // Teacher payments (outflow)
    const teacherPaymentsResult = await TeacherPayment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const teacherPaymentsTotal = teacherPaymentsResult[0]?.total ?? 0;

    // Classes conducted (completed)
    const classesConducted = await ClassSession.countDocuments({ status: 'completed' });
    const classesScheduled = await ClassSession.countDocuments({ status: 'scheduled' });

    // Enrollments over last 30 days (grouped by day)
    const enrollmentsByDay = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Revenue over last 30 days
    const revenueByDay = await Enrollment.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ]);

    // Users by role
    const usersByRole = await User.aggregate([
      { $match: { role: { $in: ['teacher', 'parent', 'student'] } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const roleMap = Object.fromEntries(usersByRole.map((r) => [r._id, r.count]));

    // New teachers/parents/students in last 30 days
    const [newTeachers, newParents, newStudents] = await Promise.all([
      Teacher.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Parent.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Student.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    // AI usage report (last 30 days)
    const [aiTotalResult, aiSuccessResult, aiByOperation, aiCallsByDay] = await Promise.all([
      AIUsageLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      AIUsageLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, success: true }),
      AIUsageLog.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$operationType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AIUsageLog.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    const aiTotalCalls = aiTotalResult;
    const aiSuccessCount = aiSuccessResult;

    return NextResponse.json({
      counts: {
        teachers: teachersCount,
        parents: parentsCount,
        students: studentsCount,
        enrollments: enrollmentsTotal,
        enrollmentsActive,
        pendingEnrollments: pendingEnrollmentsCount,
        pendingAiReviews: pendingAiReviewsCount,
        openSecurityIncidents: openSecurityIncidentsCount,
        classesConducted,
        classesScheduled,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: revenueThisMonth,
        teacherPaymentsTotal,
      },
      enrollmentsByDay: enrollmentsByDay.map((d) => ({ date: d._id, count: d.count })),
      revenueByDay: revenueByDay.map((d) => ({ date: d._id, total: d.total })),
      usersByRole: {
        teachers: roleMap.teacher ?? 0,
        parents: roleMap.parent ?? 0,
        students: roleMap.student ?? 0,
      },
      newLast30Days: {
        teachers: newTeachers,
        parents: newParents,
        students: newStudents,
      },
      aiUsageReport: {
        totalCalls: aiTotalCalls,
        successCount: aiSuccessCount,
        failedCount: aiTotalCalls - aiSuccessCount,
        successRate: aiTotalCalls > 0 ? Math.round((aiSuccessCount / aiTotalCalls) * 100) : 0,
        byOperationType: aiByOperation.map((d) => ({ operationType: d._id, count: d.count })),
        callsByDay: aiCallsByDay.map((d) => ({ date: d._id, count: d.count })),
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
