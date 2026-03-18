import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await request.json()) as any;
    const { studentId, newPassword } = body;

    if (!studentId || !newPassword || newPassword.trim().length < 4) {
      return NextResponse.json(
        { error: 'Student ID and password (min 4 characters) required' },
        { status: 400 }
      );
    }

    const student = await Student.findOne({
      studentId: String(studentId).trim(),
      parentId: parent._id,
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const hashedPassword = await hashPassword(newPassword.trim());
    await User.findByIdAndUpdate(student.userId, { $set: { password: hashedPassword } });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
