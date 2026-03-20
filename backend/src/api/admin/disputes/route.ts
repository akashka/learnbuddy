import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { PaymentDispute } from '@/lib/models/PaymentDispute';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: List all payment disputes */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const raisedBy = searchParams.get('raisedBy');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (raisedBy) query.raisedBy = raisedBy;

    await connectDB();

    const [disputes, total] = await Promise.all([
      PaymentDispute.find(query)
        .populate('userId', 'email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PaymentDispute.countDocuments(query),
    ]);

    return NextResponse.json({
      disputes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin list disputes error:', error);
    return NextResponse.json({ error: 'Failed to list disputes' }, { status: 500 });
  }
}
