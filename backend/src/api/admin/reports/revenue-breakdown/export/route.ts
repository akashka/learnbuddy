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
    const months = Math.min(24, Math.max(1, parseInt(searchParams.get('months') || '12', 10)));

    await connectDB();

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    const match = { paymentStatus: 'completed' as const, createdAt: { $gte: startDate } };

    const [byBoard, byClass, bySubject, byMonth] = await Promise.all([
      Enrollment.aggregate([{ $match: match }, { $group: { _id: '$board', revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }, { $sort: { revenue: -1 } }]),
      Enrollment.aggregate([{ $match: match }, { $group: { _id: '$classLevel', revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }, { $sort: { revenue: -1 } }]),
      Enrollment.aggregate([{ $match: match }, { $group: { _id: '$subject', revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }, { $sort: { revenue: -1 } }]),
      Enrollment.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);

    const rows: string[][] = [['Category', 'Name', 'Revenue (₹)', 'Enrollments']];
    rows.push(['', '--- By Board ---', '', '']);
    byBoard.forEach((b) => rows.push(['Board', b._id || 'Unknown', String(b.revenue), String(b.count)]));
    rows.push(['', '--- By Class ---', '', '']);
    byClass.forEach((c) => rows.push(['Class', c._id || 'Unknown', String(c.revenue), String(c.count)]));
    rows.push(['', '--- By Subject ---', '', '']);
    bySubject.forEach((s) => rows.push(['Subject', s._id || 'Unknown', String(s.revenue), String(s.count)]));
    rows.push(['', '--- By Month ---', '', '']);
    byMonth.forEach((m) => rows.push(['Month', m._id, String(m.revenue), String(m.count)]));

    const csv = toCsv(rows);
    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="revenue-breakdown-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Revenue export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
