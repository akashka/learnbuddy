import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - List enrolled students for a batch */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ index: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { index } = await context.params;
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0) {
      return NextResponse.json({ error: 'Invalid batch index' }, { status: 400 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId }).lean();
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const batch = teacher.batches?.[idx];
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    const enrollments = await Enrollment.find({
      teacherId: teacher._id,
      batchId: batch.name || '',
      status: { $in: ['active', 'completed'] },
    })
      .populate('studentId', 'name')
      .lean();

    const students = enrollments.map((e) => ({
      name: (e.studentId as { name?: string })?.name || 'Student',
      enrollmentId: e._id,
    }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Batch students error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
