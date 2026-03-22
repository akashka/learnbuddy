import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherChange } from '@/lib/models/TeacherChange';
import { getAuthFromRequest } from '@/lib/auth';

/** PATCH - Update admin remarks on a teacher change */
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
    const body = (await request.json()) as { adminRemarks?: string };

    const updated = await TeacherChange.findByIdAndUpdate(
      id,
      { $set: { adminRemarks: body.adminRemarks ?? '' } },
      { new: true }
    ).lean();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin teacher change update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
