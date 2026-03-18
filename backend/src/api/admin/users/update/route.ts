import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { Teacher } from '@/lib/models/Teacher';
import { Parent } from '@/lib/models/Parent';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { userId, isActive, deactivationReason, profileData, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    }

    if (typeof isActive === 'boolean') {
      if (!isActive) {
        await User.findByIdAndUpdate(userId, {
          $set: {
            isActive: false,
            ...(deactivationReason && { deactivationReason, deactivatedAt: new Date() }),
          },
        });
      } else {
        await User.findByIdAndUpdate(userId, {
          $set: { isActive: true },
          $unset: { deactivationReason: '', deactivatedAt: '' },
        });
      }
    }

    if (profileData && role === 'teacher') {
      await Teacher.findOneAndUpdate({ userId }, profileData);
    }
    if (profileData && role === 'parent') {
      await Parent.findOneAndUpdate({ userId }, profileData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
