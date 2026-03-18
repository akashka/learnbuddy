import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Enrollment } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv } from '@/lib/csvExport';

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

    const cohorts = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'completed' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ]);

    const rows: string[][] = [['Cohort Month', 'Enrolled', 'Retention %', 'Churn %', 'Total Revenue (₹)']];

    for (const c of cohorts) {
      const cohortStart = new Date(c._id + '-01');
      const cohortEnd = new Date(cohortStart);
      cohortEnd.setMonth(cohortEnd.getMonth() + 1);

      const [enrolled, stillActive, completed, cancelled] = await Promise.all([
        Enrollment.countDocuments({ createdAt: { $gte: cohortStart, $lt: cohortEnd }, paymentStatus: 'completed' }),
        Enrollment.countDocuments({ createdAt: { $gte: cohortStart, $lt: cohortEnd }, paymentStatus: 'completed', status: 'active' }),
        Enrollment.countDocuments({ createdAt: { $gte: cohortStart, $lt: cohortEnd }, paymentStatus: 'completed', status: 'completed' }),
        Enrollment.countDocuments({ createdAt: { $gte: cohortStart, $lt: cohortEnd }, paymentStatus: 'completed', status: 'cancelled' }),
      ]);
      const retention = enrolled > 0 ? Math.round((stillActive / enrolled) * 100) : 0;
      const churn = enrolled > 0 ? Math.round(((cancelled + completed) / enrolled) * 100) : 0;
      rows.push([c._id, String(enrolled), String(retention), String(churn), String(c.totalRevenue ?? 0)]);
    }

    const csv = toCsv(rows);
    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cohort-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Cohort export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
