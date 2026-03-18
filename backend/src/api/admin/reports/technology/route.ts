import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AIUsageLog } from '@/lib/models/AIUsageLog';
import { AIReviewRequest } from '@/lib/models/AIReviewRequest';
import { SecurityIncident } from '@/lib/models/SecurityIncident';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - Technology: AI usage, system health, incidents */
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

    // AI usage
    const aiByOperationPipeline = [
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$operationType', count: { $sum: 1 }, success: { $sum: { $cond: ['$success', 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ];
    const aiByDayPipeline = [
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, success: { $sum: { $cond: ['$success', 1, 0] } } } },
      { $sort: { _id: 1 } },
    ];
    const [aiTotal, aiSuccess, aiByOperation, aiByDay] = await Promise.all([
      AIUsageLog.countDocuments({ createdAt: { $gte: startDate } }),
      AIUsageLog.countDocuments({ createdAt: { $gte: startDate }, success: true }),
      AIUsageLog.aggregate(aiByOperationPipeline as any[]),
      AIUsageLog.aggregate(aiByDayPipeline as any[]),
    ]);

    const successRate = aiTotal > 0 ? Math.round((aiSuccess / aiTotal) * 100) : 0;

    // AI review requests
    const [pendingReviews, totalReviews] = await Promise.all([
      AIReviewRequest.countDocuments({ status: { $in: ['pending', 'in_review'] } }),
      AIReviewRequest.countDocuments({ createdAt: { $gte: startDate } }),
    ]);

    // Security incidents
    const [openIncidents, totalIncidents, incidentsBySeverity] = await Promise.all([
      SecurityIncident.countDocuments({ status: 'open' }),
      SecurityIncident.countDocuments({ createdAt: { $gte: startDate } }),
      SecurityIncident.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
    ]);

    return NextResponse.json({
      periodDays: days,
      aiUsage: {
        totalCalls: aiTotal,
        successCount: aiSuccess,
        failedCount: aiTotal - aiSuccess,
        successRate,
        byOperation: aiByOperation.map((o) => ({
          operation: o._id,
          count: o.count,
          success: o.success,
        })),
        byDay: aiByDay.map((d) => ({ date: d._id, count: d.count, success: d.success })),
      },
      aiReviews: {
        pending: pendingReviews,
        totalInPeriod: totalReviews,
      },
      security: {
        openIncidents,
        totalInPeriod: totalIncidents,
        bySeverity: incidentsBySeverity.map((s) => ({ severity: s._id, count: s.count })),
      },
    });
  } catch (error) {
    console.error('Technology report error:', error);
    return NextResponse.json({ error: 'Failed to fetch technology report' }, { status: 500 });
  }
}
