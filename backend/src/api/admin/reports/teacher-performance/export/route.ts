import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher, TeacherReview, Enrollment } from '@/lib/models';
import { ClassSession } from '@/lib/models/ClassSession';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv } from '@/lib/csvExport';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const teachers = await Teacher.find({ status: 'qualified' }).select('name _id').lean();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const rows: string[][] = [['Teacher', 'Avg Rating', 'Reviews', 'Completion %', 'Scheduled', 'Completed', 'Revenue (₹)', 'Active Enrollments']];

    for (const t of teachers) {
      const teacherId = t._id;
      const reviews = await TeacherReview.find({ teacherId }).lean();
      const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '';
      const [scheduled, completed, revenueRes, active] = await Promise.all([
        ClassSession.countDocuments({ teacherId, scheduledAt: { $gte: ninetyDaysAgo } }),
        ClassSession.countDocuments({ teacherId, status: 'completed', scheduledAt: { $gte: ninetyDaysAgo } }),
        Enrollment.aggregate([{ $match: { teacherId, paymentStatus: 'completed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        Enrollment.countDocuments({ teacherId, status: 'active' }),
      ]);
      const completion = scheduled > 0 ? Math.round((completed / scheduled) * 100) : '';
      const revenue = revenueRes[0]?.total ?? 0;
      rows.push([
        (t as { name?: string }).name || 'Unknown',
        String(avgRating),
        String(reviews.length),
        String(completion),
        String(scheduled),
        String(completed),
        String(revenue),
        String(active),
      ]);
    }

    const csv = toCsv(rows);
    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="teacher-performance-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Teacher performance export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
