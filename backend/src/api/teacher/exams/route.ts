import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { Enrollment } from '@/lib/models/Enrollment';
import { StudentExam } from '@/lib/models/StudentExam';
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

    const enrollments = await Enrollment.find({ teacherId: teacher._id }).select('studentId').lean();
    const studentIds = enrollments.map((e) => e.studentId).filter(Boolean);

    const exams = await StudentExam.find({ studentId: { $in: studentIds }, status: 'completed' })
      .populate('studentId', 'name studentId')
      .sort({ attemptedAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ exams });
  } catch (error) {
    console.error('Teacher exams error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
