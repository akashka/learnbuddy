import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { StudentExam } from '@/lib/models/StudentExam';
import { Enrollment } from '@/lib/models/Enrollment';
import { Teacher } from '@/lib/models/Teacher';
import { Parent } from '@/lib/models/Parent';
import { evaluateStudentExam, type StudentExamQuestion } from '@/lib/ai';
import { getAuthFromRequest } from '@/lib/auth';
import { createNotification } from '@/lib/notification-service';
import { logAIUsage } from '@/lib/ai-audit';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const { examId } = body;

    if (!examId) return NextResponse.json({ error: 'Exam ID required' }, { status: 400 });

    const exam = await StudentExam.findOne({ _id: examId, studentId: student._id });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    if (exam.status !== 'evaluating') {
      return NextResponse.json({ error: 'Exam not pending evaluation' }, { status: 400 });
    }

    const normalizedAnswers = (exam.answers || []).map((a: unknown) => {
      if (typeof a === 'object' && a !== null && 'value' in a) return (a as { value: number | string }).value;
      return a;
    });

    const start = Date.now();
    let score: number;
    let feedback: { good: string[]; bad: string[]; overall: string; questionFeedback?: { questionIndex: number; correct: boolean; feedback: string }[] };
    try {
      const result = await evaluateStudentExam(
        exam.questions as StudentExamQuestion[],
        normalizedAnswers
      );
      score = result.score;
      feedback = result.feedback;
    } catch (err) {
      await logAIUsage({
        operationType: 'evaluate_student_exam',
        userId: decoded.userId,
        userRole: 'student',
        entityId: examId,
        entityType: 'exam',
        inputMetadata: { questionCount: exam.questions?.length ?? 0 },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'evaluate_student_exam',
      userId: decoded.userId,
      userRole: 'student',
      entityId: examId,
      entityType: 'exam',
      inputMetadata: { questionCount: exam.questions?.length ?? 0 },
      outputMetadata: { score, totalMarks: exam.totalMarks },
      durationMs: Date.now() - start,
      success: true,
    });

    const status = exam.closedDueToCheating || (exam.warnings || 0) >= 3 ? 'terminated' : 'completed';
    const finalScore = status === 'terminated' ? 0 : score;

    await StudentExam.findByIdAndUpdate(examId, {
      score: finalScore,
      aiFeedback: feedback,
      status,
      completedAt: new Date(),
    });

    // Notify teacher and parent when exam is completed (not terminated)
    if (status === 'completed') {
      const student = await Student.findById(exam.studentId).select('name parentId').lean();
      const enrollment = exam.enrollmentId
        ? await Enrollment.findById(exam.enrollmentId).select('teacherId').lean()
        : await Enrollment.findOne({ studentId: exam.studentId, subject: exam.subject, status: 'active' }).select('teacherId').lean();
      const targetUserIds: { type: string; id: unknown }[] = [];
      if (enrollment?.teacherId) targetUserIds.push({ type: 'teacher', id: enrollment.teacherId });
      if (student?.parentId) targetUserIds.push({ type: 'parent', id: student.parentId });
      const studentName = (student as { name?: string })?.name || 'Student';
      const scoreMsg = `${studentName} scored ${finalScore}/${exam.totalMarks} in ${exam.subject}.`;
      for (const t of targetUserIds) {
        let userId: string | null = null;
        if (t.type === 'teacher') {
          const teacher = await Teacher.findById(t.id).select('userId').lean();
          userId = teacher?.userId ? String(teacher.userId) : null;
        } else {
          const parent = await Parent.findById(t.id).select('userId').lean();
          userId = parent?.userId ? String(parent.userId) : null;
        }
        if (userId) {
          const ctaUrl = t.type === 'teacher' ? '/teacher/exams' : '/parent/performances';
          createNotification({
            userId: new mongoose.Types.ObjectId(userId),
            type: 'exam_completed',
            title: 'Exam result ready!',
            message: scoreMsg,
            ctaLabel: 'View Results',
            ctaUrl,
            entityType: 'exam',
            entityId: String(examId),
            metadata: { score: finalScore, totalMarks: exam.totalMarks, subject: exam.subject },
          }).catch((err) => console.error('Notification error:', err));
        }
      }
    }

    return NextResponse.json({
      success: true,
      score: finalScore,
      totalMarks: exam.totalMarks,
      feedback,
      status,
    });
  } catch (error) {
    console.error('Exam evaluate error:', error);
    return NextResponse.json({ error: 'Failed to evaluate exam' }, { status: 500 });
  }
}
