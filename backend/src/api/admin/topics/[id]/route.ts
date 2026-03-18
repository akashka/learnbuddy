import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Topic } from '@/lib/models/Topic';
import { getAuthFromRequest } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = (await request.json()) as any;
    const { topic, displayOrder, isActive } = body;

    const updates: Record<string, unknown> = {};
    if (topic !== undefined) updates.topic = topic.trim();
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await Topic.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin topics update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const deleted = await Topic.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin topics delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
