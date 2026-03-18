import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AIReviewRequest } from '@/lib/models/AIReviewRequest';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - List all AI review requests (admin) */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const status = searchParams.get('status');
    const entityType = searchParams.get('entityType');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (entityType) query.entityType = entityType;

    const skip = (page - 1) * limit;
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const [requests, total] = await Promise.all([
      AIReviewRequest.find(query)
        .populate('raisedBy', 'email phone')
        .populate('studentId', 'name classLevel')
        .sort(sortObj as any)
        .skip(skip)
        .limit(limit)
        .lean(),
      AIReviewRequest.countDocuments(query),
    ]);

    return NextResponse.json({
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin AI review list error:', error);
    return NextResponse.json({ error: 'Failed to list review requests' }, { status: 500 });
  }
}
