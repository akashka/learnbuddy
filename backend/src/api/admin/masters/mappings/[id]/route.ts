import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { BoardClassSubject } from '@/lib/models/BoardClassSubject';
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
    if (body.board !== undefined) updates.board = body.board;
    if (body.classLevel !== undefined) updates.classLevel = body.classLevel;
    if (body.subjects !== undefined) updates.subjects = body.subjects;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const mapping = await BoardClassSubject.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    if (!mapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    await cacheInvalidatePattern('bcs:*');
    return NextResponse.json(mapping);
  } catch (error) {
    console.error('Mapping update error:', error);
    return NextResponse.json({ error: 'Failed to update mapping' }, { status: 500 });
  }
}
