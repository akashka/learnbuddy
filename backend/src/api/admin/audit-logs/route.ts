import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AuditLog } from '@/lib/models/AuditLog';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - List audit logs for compliance (admin only) */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const actorId = searchParams.get('actorId');
    const success = searchParams.get('success');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (actorId) query.actorId = actorId;
    if (success === 'true') query.success = true;
    if (success === 'false') query.success = false;
    if (from || to) {
      query.createdAt = {};
      if (from) (query.createdAt as Record<string, Date>).$gte = new Date(from);
      if (to) (query.createdAt as Record<string, Date>).$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort(sortObj as any).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin audit logs error:', error);
    return NextResponse.json({ error: 'Failed to list audit logs' }, { status: 500 });
  }
}
