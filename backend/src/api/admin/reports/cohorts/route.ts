import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Enrollment } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - Cohort reports: retention, churn by enrollment month */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthsBack = Math.min(12, Math.max(3, parseInt(searchParams.get('months') || '6', 10)));

    await connectDB();

    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Cohorts: group enrollments by month of creation (startDate)
    const cohorts = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // For each cohort month, compute retention/churn at different horizons
    const cohortDetails = await Promise.all(
      cohorts.map(async (c) => {
        const cohortStart = new Date(c._id + '-01');
        const cohortEnd = new Date(cohortStart);
        cohortEnd.setMonth(cohortEnd.getMonth() + 1);
        cohortEnd.setMilliseconds(-1);

        const enrolledInCohort = await Enrollment.countDocuments({
          createdAt: { $gte: cohortStart, $lt: cohortEnd },
          paymentStatus: 'completed',
        });

        const stillActive = await Enrollment.countDocuments({
          createdAt: { $gte: cohortStart, $lt: cohortEnd },
          paymentStatus: 'completed',
          status: 'active',
        });

        const completed = await Enrollment.countDocuments({
          createdAt: { $gte: cohortStart, $lt: cohortEnd },
          paymentStatus: 'completed',
          status: 'completed',
        });

        const cancelled = await Enrollment.countDocuments({
          createdAt: { $gte: cohortStart, $lt: cohortEnd },
          paymentStatus: 'completed',
          status: 'cancelled',
        });

        const retentionRate = enrolledInCohort > 0 ? Math.round((stillActive / enrolledInCohort) * 100) : 0;
        const churnRate = enrolledInCohort > 0 ? Math.round(((cancelled + completed) / enrolledInCohort) * 100) : 0;

        return {
          cohortMonth: c._id,
          enrolled: enrolledInCohort,
          stillActive,
          completed,
          cancelled,
          retentionRate,
          churnRate,
          totalRevenue: c.totalRevenue,
        };
      })
    );

    // Retention curve: % retained at month 1, 2, 3... for oldest cohort
    const retentionByMonth: { month: number; retained: number; cohortSize: number }[] = [];
    if (cohortDetails.length > 0) {
      const oldestCohort = cohortDetails[0];
      const cohortStart = new Date(oldestCohort.cohortMonth + '-01');
      for (let m = 1; m <= Math.min(6, monthsBack); m++) {
        const horizonEnd = new Date(cohortStart);
        horizonEnd.setMonth(horizonEnd.getMonth() + m);
        const stillActiveAtHorizon = await Enrollment.countDocuments({
          createdAt: { $gte: cohortStart, $lt: new Date(cohortStart.getFullYear(), cohortStart.getMonth() + 1, 0) },
          paymentStatus: 'completed',
          $or: [{ status: 'active' }, { status: 'completed', endDate: { $gte: horizonEnd } }],
        });
        retentionByMonth.push({
          month: m,
          retained: stillActiveAtHorizon,
          cohortSize: oldestCohort.enrolled,
        });
      }
    }

    return NextResponse.json({
      cohortDetails,
      retentionByMonth,
      summary: {
        totalCohorts: cohortDetails.length,
        avgRetention: cohortDetails.length > 0
          ? Math.round(cohortDetails.reduce((a, c) => a + c.retentionRate, 0) / cohortDetails.length)
          : 0,
        avgChurn: cohortDetails.length > 0
          ? Math.round(cohortDetails.reduce((a, c) => a + c.churnRate, 0) / cohortDetails.length)
          : 0,
      },
    });
  } catch (error) {
    console.error('Cohort reports error:', error);
    return NextResponse.json({ error: 'Failed to fetch cohort reports' }, { status: 500 });
  }
}
