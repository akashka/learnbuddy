import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { JobApplication } from '@/lib/models/JobApplication';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: Get single job application */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await connectDB();
    const app = await JobApplication.findById(id)
      .populate('positionId', 'title team type location description')
      .lean();
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pos = app.positionId as { _id?: unknown; title?: string; team?: string; type?: string; location?: string; description?: string } | null;
    return NextResponse.json({
      id: app._id.toString(),
      positionId: pos?._id ? String(pos._id) : String(app.positionId),
      position: app.positionId,
      name: app.name,
      email: app.email,
      phone: app.phone,
      resumeUrl: app.resumeUrl,
      coverLetter: app.coverLetter,
      status: app.status,
      remarks: app.remarks,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    });
  } catch (error) {
    console.error('Admin job application get error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

/** Admin: Update job application (status, remarks) */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const body = await request.json();
    const updates: Record<string, string> = {};
    if (typeof body.status === 'string' && ['new', 'viewed', 'in_process', 'approved', 'rejected'].includes(body.status)) {
      updates.status = body.status;
    }
    if (typeof body.remarks === 'string') updates.remarks = body.remarks.trim();

    await connectDB();
    const app = await JobApplication.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('positionId', 'title team type location')
      .lean();
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pos = app.positionId as { _id?: unknown; title?: string } | null;
    return NextResponse.json({
      id: app._id.toString(),
      positionId: pos?._id ? String(pos._id) : String(app.positionId),
      positionTitle: pos?.title,
      name: app.name,
      email: app.email,
      phone: app.phone,
      resumeUrl: app.resumeUrl,
      coverLetter: app.coverLetter,
      status: app.status,
      remarks: app.remarks,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    });
  } catch (error) {
    console.error('Admin job application update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
