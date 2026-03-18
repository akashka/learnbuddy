import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { StudentExam } from '@/lib/models/StudentExam';
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

    const exams = await StudentExam.find({ studentId: student._id }).sort({ attemptedAt: -1 }).limit(50).lean();
    return NextResponse.json({ exams });
  } catch (error) {
    console.error('Student exams error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
