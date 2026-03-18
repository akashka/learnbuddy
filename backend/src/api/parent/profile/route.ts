import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { User } from '@/lib/models/User';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId })
      .populate('userId', 'email emailVerifiedAt')
      .lean();

    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const userId = parent.userId as { email?: string; emailVerifiedAt?: Date };
    return NextResponse.json({
      name: parent.name,
      email: userId?.email,
      emailVerifiedAt: userId?.emailVerifiedAt,
      phone: parent.phone,
      location: parent.location,
    });
  } catch (error) {
    console.error('Profile get error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const { name, location, email } = body;

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (location !== undefined) update.location = location;

    await Parent.findOneAndUpdate(
      { userId: decoded.userId },
      { $set: update }
    );

    if (email !== undefined) {
      const existing = await User.findOne({ email, _id: { $ne: decoded.userId } });
      if (existing) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      await User.findByIdAndUpdate(decoded.userId, {
        $set: { email },
        $unset: { emailVerifiedAt: 1 },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
