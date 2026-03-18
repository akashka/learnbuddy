import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { JobApplication } from '@/lib/models/JobApplication';
import { JobPosition } from '@/lib/models/JobPosition';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: List job applications with optional filters */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const positionId = url.searchParams.get('positionId');
    const status = url.searchParams.get('status');

    await connectDB();
    const filter: Record<string, unknown> = {};
    if (positionId) filter.positionId = positionId;
    if (status) filter.status = status;

    const applications = await JobApplication.find(filter)
      .populate('positionId', 'title team type location')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      applications: applications.map((a) => {
        const pos = a.positionId as { _id?: unknown; title?: string } | null;
        return {
        id: a._id.toString(),
        positionId: pos?._id ? String(pos._id) : String(a.positionId),
        positionTitle: pos?.title,
        name: a.name,
        email: a.email,
        phone: a.phone,
        resumeUrl: a.resumeUrl,
        coverLetter: a.coverLetter,
        status: a.status,
        remarks: a.remarks,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      };
      }),
    });
  } catch (error) {
    console.error('Admin job applications list error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
