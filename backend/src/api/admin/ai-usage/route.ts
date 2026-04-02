import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AIUsageLog } from '@/lib/models/AIUsageLog';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Overall stats
    const stats = await AIUsageLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          totalTokens: { $sum: '$totalTokens' },
          totalCalls: { $sum: 1 },
          successRate: { $avg: { $cond: ['$success', 1, 0] } }
        }
      }
    ]);

    // 2. Stats by Provider (source)
    const byProvider = await AIUsageLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$source',
          cost: { $sum: '$cost' },
          calls: { $sum: 1 }
        }
      }
    ]);

    // 3. Stats by Operation Type
    const byOperation = await AIUsageLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$operationType',
          cost: { $sum: '$cost' },
          calls: { $sum: 1 }
        }
      },
      { $sort: { cost: -1 } }
    ]);

    // 4. Daily cost trend
    const dailyTrend = await AIUsageLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          cost: { $sum: '$cost' },
          calls: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      summary: stats[0] || { totalCost: 0, totalTokens: 0, totalCalls: 0, successRate: 0 },
      byProvider,
      byOperation,
      dailyTrend
    });
  } catch (error) {
    console.error('[AdminAIUsage] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
