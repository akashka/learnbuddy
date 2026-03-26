import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Enrollment } from '@/lib/models/Enrollment';
import { generateStudentExamQuestions, mapLegacyExamMode, type ExamType } from '@/lib/ai';
import { saveAIGeneratedContent } from '@/lib/ai-data-store';
import { getAuthFromRequest } from '@/lib/auth';
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

    const body = (await request.json()) as any;
    const { subject, board, classLevel, examMode, examType, topic, topics, answerInputType } = body;

    if (!subject || !board || !classLevel) {
      return NextResponse.json({ error: 'Subject, board, and classLevel required' }, { status: 400 });
    }

    const enrollment = await Enrollment.findOne({
      studentId: student._id,
      status: 'active',
      subject,
      board,
      classLevel,
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'You can only take exams for subjects you have an active tuition course for' }, { status: 403 });
    }

    const resolvedExamType: ExamType = (examType && ['quick_test', 'class_test', 'preparatory'].includes(examType))
      ? examType
      : mapLegacyExamMode(examMode || 'mini', examType);

    const topicList: string[] | undefined =
      resolvedExamType === 'preparatory'
        ? undefined
        : Array.isArray(topics) && topics.length > 0
          ? topics
          : topic
            ? [topic]
            : undefined;

    const start = Date.now();
    let questions: unknown[];
    let timeLimit: number;
    let totalMarks: number;
    try {
      const result = await generateStudentExamQuestions(
        subject,
        board,
        classLevel,
        resolvedExamType,
        topicList,
        (answerInputType || 'typed') as 'typed' | 'photo' | 'audio'
      );
      questions = result.questions;
      timeLimit = result.timeLimit;
      totalMarks = result.totalMarks;
    } catch (err) {
      await logAIUsage({
        operationType: 'generate_exam_questions',
        userId: decoded.userId,
        userRole: 'student',
        inputMetadata: { subject, board, classLevel, examType: resolvedExamType, topicCount: topicList?.length ?? 0 },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'generate_exam_questions',
      userId: decoded.userId,
      userRole: 'student',
      inputMetadata: { subject, board, classLevel, examType: resolvedExamType, topicCount: topicList?.length ?? 0 },
      outputMetadata: { questionCount: questions.length, timeLimit, totalMarks },
      durationMs: Date.now() - start,
      success: true,
    });

    await saveAIGeneratedContent({
      type: 'exam_questions',
      board,
      classLevel,
      subject,
      topics: topicList,
      content: { questions, timeLimit, totalMarks: totalMarks },
      requestedBy: decoded.userId as any,
      requesterRole: 'student',
      metadata: { examType: resolvedExamType },
    });

    return NextResponse.json({
      questions,
      timeLimit,
      totalMarks,
      subject,
      board,
      classLevel,
      examType: resolvedExamType,
      topics: topicList,
    });
  } catch (error) {
    console.error('Exam generate error:', error);
    return NextResponse.json({ error: 'Failed to generate exam' }, { status: 500 });
  }
}
