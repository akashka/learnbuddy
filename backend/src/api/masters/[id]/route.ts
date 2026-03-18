import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Master } from '@/lib/models/Master';
import { getAuthFromRequest } from '@/lib/auth';
import { cacheInvalidatePattern } from '@/lib/cache';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = (await request.json()) as any;
    const updates: Record<string, unknown> = {};
    if (body.value !== undefined) updates.value = body.value;
    if (body.displayOrder !== undefined) updates.displayOrder = body.displayOrder;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const master = await Master.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!master) {
      return NextResponse.json({ error: 'Master not found' }, { status: 404 });
    }

    await cacheInvalidatePattern('masters:*');
    return NextResponse.json(master);
  } catch (error) {
    console.error('Master update error:', error);
    return NextResponse.json({ error: 'Failed to update master' }, { status: 500 });
  }
}
