import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { createDeleteRequest } from '@/lib/deleteAccount';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'parent' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { scope, studentIds } = body;

    if (decoded.role === 'teacher') {
      if (scope !== 'full') {
        return NextResponse.json({ error: 'Teachers can only request full account deletion' }, { status: 400 });
      }
      const { otp, expiresAt } = await createDeleteRequest(decoded.userId, 'teacher', 'full');
      const user = await User.findById(decoded.userId).select('phone').lean();
      const phone = user?.phone || '';
      // TODO: Send OTP via SMS - until then log
      console.log(`[Delete OTP] Teacher ${decoded.userId} (${phone}): ${otp}`);
      return NextResponse.json({
        success: true,
        message: 'OTP sent to your registered phone number',
        devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
        expiresAt,
      });
    }

    if (decoded.role === 'parent') {
      if (scope !== 'students' && scope !== 'full') {
        return NextResponse.json({ error: 'Invalid scope. Use "students" or "full"' }, { status: 400 });
      }
      if (scope === 'students' && (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0)) {
        return NextResponse.json({ error: 'studentIds required when scope is "students"' }, { status: 400 });
      }

      const parent = await Parent.findOne({ userId: decoded.userId });
      if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

      if (scope === 'students') {
        const students = await Student.find({ _id: { $in: studentIds }, parentId: parent._id });
        if (students.length === 0) {
          return NextResponse.json({ error: 'No valid student IDs provided' }, { status: 400 });
        }
      }

      const { otp, expiresAt } = await createDeleteRequest(
        decoded.userId,
        'parent',
        scope,
        scope === 'students' ? studentIds : undefined
      );
      const user = await User.findById(decoded.userId).select('phone').lean();
      const phone = user?.phone || '';
      console.log(`[Delete OTP] Parent ${decoded.userId} (${phone}): ${otp}`);
      return NextResponse.json({
        success: true,
        message: 'OTP sent to your registered phone number',
        devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
        expiresAt,
      });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json({ error: 'Failed to initiate deletion' }, { status: 500 });
  }
}
