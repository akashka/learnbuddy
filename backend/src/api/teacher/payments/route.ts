import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { TeacherPayment } from '@/lib/models/TeacherPayment';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const payments = await TeacherPayment.find({ teacherId: teacher._id }).sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Teacher payments error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
