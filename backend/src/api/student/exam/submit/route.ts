import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { StudentExam } from '@/lib/models/StudentExam';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await request.json()) as any;
    const { examId, answers, warnings, closedDueToCheating, timeTaken } = body;

    if (!examId) return NextResponse.json({ error: 'Exam ID required' }, { status: 400 });

    const exam = await StudentExam.findOne({ _id: examId, studentId: student._id });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    if (exam.status !== 'in_progress') {
      return NextResponse.json({ error: 'Exam already submitted or terminated' }, { status: 400 });
    }

    await StudentExam.findByIdAndUpdate(examId, {
      answers: answers || exam.answers,
      timeTaken: timeTaken || 0,
      status: 'evaluating',
      warnings: warnings || exam.warnings,
      closedDueToCheating: closedDueToCheating || false,
    });

    return NextResponse.json({
      success: true,
      examId,
      status: 'evaluating',
      totalMarks: exam.totalMarks,
    });
  } catch (error) {
    console.error('Exam submit error:', error);
    return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 });
  }
}
