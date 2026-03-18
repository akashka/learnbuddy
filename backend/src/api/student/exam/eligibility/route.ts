import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enrollments = await Enrollment.find({ studentId: student._id, status: 'active' }).lean();

    const subjects = [...new Map(
      enrollments.map((e) => [`${e.subject}-${e.board}-${e.classLevel}`, { subject: e.subject, board: e.board, classLevel: e.classLevel }])
    ).values()];

    return NextResponse.json({
      subjects,
      message: 'You can only take exams for subjects you have an active tuition course for.',
    });
  } catch (error) {
    console.error('Exam eligibility error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
