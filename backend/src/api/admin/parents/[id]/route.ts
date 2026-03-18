import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(
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
    const parent = await Parent.findById(id)
      .populate('userId', 'email isActive')
      .populate({ path: 'children', populate: { path: 'userId', select: 'email isActive' } })
      .lean();

    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    return NextResponse.json(parent);
  } catch (error) {
    console.error('Parent detail error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

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
    const { name, phone, location } = body;

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (location !== undefined) update.location = location;

    const parent = await Parent.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate('userId', 'email isActive')
      .populate({ path: 'children', populate: { path: 'userId', select: 'email isActive' } })
      .lean();

    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    return NextResponse.json(parent);
  } catch (error) {
    console.error('Parent update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
