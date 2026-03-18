import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { JobPosition } from '@/lib/models/JobPosition';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: Get single job position */
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
    const position = await JobPosition.findById(id).lean();
    if (!position) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      id: position._id.toString(),
      title: position.title,
      team: position.team,
      type: position.type,
      location: position.location,
      description: position.description,
      jdUrl: position.jdUrl || null,
      status: position.status,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    });
  } catch (error) {
    console.error('Admin job position get error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

/** Admin: Update job position */
export async function PUT(
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

    const body = (await request.json()) as any;
    const updates: Record<string, string> = {};
    if (typeof body.title === 'string') updates.title = body.title.trim();
    if (typeof body.team === 'string') updates.team = body.team.trim();
    if (typeof body.type === 'string') updates.type = body.type.trim();
    if (typeof body.location === 'string') updates.location = body.location.trim();
    if (typeof body.description === 'string') updates.description = body.description.trim();
    if (typeof body.status === 'string' && ['open', 'closed'].includes(body.status)) updates.status = body.status;

    await connectDB();
    const position = await JobPosition.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!position) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      id: position._id.toString(),
      title: position.title,
      team: position.team,
      type: position.type,
      location: position.location,
      description: position.description,
      jdUrl: position.jdUrl || null,
      status: position.status,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    });
  } catch (error) {
    console.error('Admin job position update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/** Admin: Delete job position */
export async function DELETE(
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
    const position = await JobPosition.findByIdAndDelete(id);
    if (!position) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Admin job position delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
