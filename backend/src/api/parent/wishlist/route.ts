import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { ParentWishlist } from '@/lib/models/ParentWishlist';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId }).lean();
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

    const items = await ParentWishlist.find({ parentId: parent._id })
      .select('teacherId')
      .lean();

    const teacherIds = items.map((i) => i.teacherId.toString());
    return NextResponse.json({ teacherIds });
  } catch (error) {
    console.error('Wishlist get error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId }).lean();
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

    const body = await request.json();
    const { teacherId } = body;
    if (!teacherId) return NextResponse.json({ error: 'teacherId required' }, { status: 400 });

    await ParentWishlist.findOneAndUpdate(
      { parentId: parent._id, teacherId },
      { $set: { parentId: parent._id, teacherId } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wishlist add error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId }).lean();
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    if (!teacherId) return NextResponse.json({ error: 'teacherId required' }, { status: 400 });

    await ParentWishlist.deleteOne({ parentId: parent._id, teacherId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wishlist remove error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
