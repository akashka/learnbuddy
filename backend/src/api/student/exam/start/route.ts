import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Enrollment } from '@/lib/models/Enrollment';
import { StudentExam } from '@/lib/models/StudentExam';
import { generateStudentExamQuestions, mapLegacyExamMode, type ExamType } from '@/lib/ai';
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
    const { subject, board, classLevel, examMode, examType, topic, topics, answerInputType, preGeneratedQuestions } = body;

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

    let questions: { question: string; type: string; options?: string[]; correctAnswer?: number | string; marks: number }[];
    let timeLimit: number;
    let totalMarks: number;

    if (Array.isArray(preGeneratedQuestions) && preGeneratedQuestions.length > 0) {
      questions = preGeneratedQuestions;
      timeLimit = body.timeLimit ?? 30;
      totalMarks = body.totalMarks ?? questions.reduce((s, q) => s + (q.marks || 1), 0);
    } else {
      const generated = await generateStudentExamQuestions(
        subject,
        board,
        classLevel,
        resolvedExamType,
        topicList
      );
      questions = generated.questions;
      timeLimit = generated.timeLimit;
      totalMarks = generated.totalMarks;
    }

    const exam = await StudentExam.create({
      studentId: student._id,
      subject,
      board,
      classLevel,
      examType: resolvedExamType,
      topic: topicList?.[0],
      topics: topicList,
      questions,
      answers: new Array(questions.length).fill(''),
      answerInputType: answerInputType || 'typed',
      totalMarks,
      timeLimit,
      status: 'in_progress',
      enrollmentId: enrollment._id,
    });

    return NextResponse.json({
      examId: exam._id,
      questions,
      timeLimit,
      totalMarks,
    });
  } catch (error) {
    console.error('Exam start error:', error);
    return NextResponse.json({ error: 'Failed to start exam' }, { status: 500 });
  }
}
