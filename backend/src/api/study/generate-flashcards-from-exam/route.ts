import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { StudentExam } from '@/lib/models/StudentExam';
import { generateFlashcardsFromExamFeedback } from '@/lib/ai';
import { getAuthFromRequest } from '@/lib/auth';
import { logAIUsage } from '@/lib/ai-audit';

/** Option D: Generate flashcards from exam feedback (weak areas) */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await request.json()) as { examId?: string };
    const { examId } = body;

    if (!examId) return NextResponse.json({ error: 'examId required' }, { status: 400 });

    const exam = await StudentExam.findOne({ _id: examId, studentId: student._id });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    if (exam.status !== 'completed' && exam.status !== 'terminated') {
      return NextResponse.json({ error: 'Exam must be completed to generate flashcards from feedback' }, { status: 400 });
    }

    const feedback = exam.aiFeedback;
    const questions = exam.questions || [];
    if (!feedback || questions.length === 0) {
      return NextResponse.json({ error: 'Exam has no feedback or questions' }, { status: 400 });
    }

    const incorrectCount = (feedback.questionFeedback || []).filter((qf) => !qf.correct).length;
    if (incorrectCount === 0) {
      return NextResponse.json({
        cards: [],
        message: 'Great job! You got all questions correct. No flashcards needed for weak areas.',
      });
    }

    const start = Date.now();
    let result;
    try {
      result = await generateFlashcardsFromExamFeedback(
        feedback,
        questions,
        exam.subject || '',
        exam.board || '',
        exam.classLevel || ''
      );
    } catch (err) {
      await logAIUsage({
        operationType: 'generate_flashcards',
        userId: decoded.userId,
        userRole: 'student',
        entityId: examId,
        entityType: 'exam',
        inputMetadata: { subject: exam.subject, examId },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'generate_flashcards',
      userId: decoded.userId,
      userRole: 'student',
      entityId: examId,
      entityType: 'exam',
      inputMetadata: { subject: exam.subject, examId },
      outputMetadata: { cardCount: result.cards?.length ?? 0 },
      durationMs: Date.now() - start,
      success: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate flashcards from exam error:', error);
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 });
  }
}
