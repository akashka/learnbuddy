import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';
import { calculateTeacherProRata } from '@/lib/earning-utils';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const searchParams = request.nextUrl.searchParams;
    const targetDateStr = searchParams.get('date');
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();

    const earningData = await calculateTeacherProRata(teacher, targetDate);

    return NextResponse.json({ data: earningData });
  } catch (error) {
    console.error('Teacher pro-rata GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
