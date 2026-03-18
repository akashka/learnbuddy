import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ContactSubmission } from '@/lib/models/ContactSubmission';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: List contact submissions with optional filters */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));

    await connectDB();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [submissions, total] = await Promise.all([
      ContactSubmission.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactSubmission.countDocuments(filter),
    ]);

    return NextResponse.json({
      submissions: submissions.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        phone: s.phone,
        type: s.type,
        subject: s.subject,
        message: s.message,
        status: s.status,
        adminNotes: s.adminNotes,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin contact submissions list error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
