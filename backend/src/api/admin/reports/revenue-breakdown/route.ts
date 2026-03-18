import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Enrollment } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - Revenue breakdown by board, class, subject */
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

    // By board
    const byBoard = await Enrollment.aggregate([
      { $match: match },
      { $group: { _id: '$board', revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
    ]);

    // By class
    const byClass = await Enrollment.aggregate([
      { $match: match },
      { $group: { _id: '$classLevel', revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
    ]);

    // By subject
    const bySubject = await Enrollment.aggregate([
      { $match: match },
      { $group: { _id: '$subject', revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
    ]);

    // By board + class
    const byBoardClass = await Enrollment.aggregate([
      { $match: match },
      { $group: { _id: { board: '$board', classLevel: '$classLevel' }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 20 },
    ]);

    // By board + subject
    const byBoardSubject = await Enrollment.aggregate([
      { $match: match },
      { $group: { _id: { board: '$board', subject: '$subject' }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 20 },
    ]);

    // Revenue by month (time series)
    const revenueByMonth = await Enrollment.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const totalRevenue = byBoard.reduce((a, b) => a + b.revenue, 0);

    return NextResponse.json({
      byBoard: byBoard.map((b) => ({ name: b._id || 'Unknown', revenue: b.revenue, count: b.count })),
      byClass: byClass.map((c) => ({ name: c._id || 'Unknown', revenue: c.revenue, count: c.count })),
      bySubject: bySubject.map((s) => ({ name: s._id || 'Unknown', revenue: s.revenue, count: s.count })),
      byBoardClass: byBoardClass.map((bc) => ({
        board: bc._id.board || 'Unknown',
        classLevel: bc._id.classLevel || 'Unknown',
        revenue: bc.revenue,
        count: bc.count,
      })),
      byBoardSubject: byBoardSubject.map((bs) => ({
        board: bs._id.board || 'Unknown',
        subject: bs._id.subject || 'Unknown',
        revenue: bs.revenue,
        count: bs.count,
      })),
      revenueByMonth: revenueByMonth.map((m) => ({ month: m._id, revenue: m.revenue, count: m.count })),
      totalRevenue,
      periodMonths: months,
    });
  } catch (error) {
    console.error('Revenue breakdown error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue breakdown' }, { status: 500 });
  }
}
