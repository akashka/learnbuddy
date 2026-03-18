import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AIUsageLog } from '@/lib/models/AIUsageLog';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - List AI usage logs for audit (admin only) */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const operationType = searchParams.get('operationType');
    const success = searchParams.get('success');
    const source = searchParams.get('source');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const query: Record<string, unknown> = {};
    if (operationType) query.operationType = operationType;
    if (success === 'true') query.success = true;
    if (success === 'false') query.success = false;
    if (source) query.source = source;

    const skip = (page - 1) * limit;
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const [logs, total] = await Promise.all([
      AIUsageLog.find(query)
        .populate('userId', 'email phone')
        .sort(sortObj as any)
        .skip(skip)
        .limit(limit)
        .lean(),
      AIUsageLog.countDocuments(query),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin AI usage logs error:', error);
    return NextResponse.json({ error: 'Failed to list AI usage logs' }, { status: 500 });
  }
}
