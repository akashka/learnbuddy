import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';
import { calculateTeacherProRata } from '@/lib/earning-utils';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = context.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const searchParams = request.nextUrl.searchParams;
    const targetDateStr = searchParams.get('date');
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();

    const earningData = await calculateTeacherProRata(teacher, targetDate);

    return NextResponse.json({ data: earningData });
  } catch (error) {
    console.error('Admin teacher pro-rata GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
