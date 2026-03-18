import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { SecurityIncident } from '@/lib/models/SecurityIncident';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const childrenAffected = searchParams.get('childrenAffected');
    const sort = searchParams.get('sort') || 'detectedAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (childrenAffected === 'true') query.childrenDataAffected = true;

    const skip = (page - 1) * limit;
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const [incidents, total] = await Promise.all([
      SecurityIncident.find(query)
        .populate('reportedBy', 'email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      SecurityIncident.countDocuments(query),
    ]);

    return NextResponse.json({
      incidents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Security incidents list error:', error);
    return NextResponse.json({ error: 'Failed to list incidents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      title,
      description,
      type,
      severity,
      childrenDataAffected,
      detectedAt,
      affectedDataTypes,
      affectedUserCount,
      actionsTaken,
    } = body;

    if (!title || !description || !type || !severity) {
      return NextResponse.json(
        { error: 'title, description, type, and severity are required' },
        { status: 400 }
      );
    }

    const incident = await SecurityIncident.create({
      title,
      description,
      type,
      severity,
      childrenDataAffected: !!childrenDataAffected,
      detectedAt: detectedAt ? new Date(detectedAt) : new Date(),
      affectedDataTypes: affectedDataTypes || [],
      affectedUserCount: affectedUserCount ?? undefined,
      actionsTaken: actionsTaken || [],
      reportedBy: decoded.userId,
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Security incident create error:', error);
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}
