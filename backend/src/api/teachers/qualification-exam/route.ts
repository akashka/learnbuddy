import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { QualificationExam } from '@/lib/models/QualificationExam';
import { generateQualificationExam } from '@/lib/ai';
import { saveAIGeneratedContent } from '@/lib/ai-data-store';
import { getAuthFromRequest } from '@/lib/auth';
import { cacheInvalidatePattern } from '@/lib/cache';
import { logAIUsage } from '@/lib/ai-audit';

const QUALIFICATION_THRESHOLD = 60; // 60% to pass
const MAX_ATTEMPTS = 3;
const RETRY_HOURS = 24;

export async function GET(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const board = searchParams.get('board');
    const classLevel = searchParams.get('class');

    if (!subject || !board || !classLevel) {
      return NextResponse.json({ error: 'Subject, board and class required' }, { status: 400 });
    }

    if (teacher.qualificationExamAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Maximum attempts reached. Try again after 24 hours.' }, { status: 400 });
    }

    if (teacher.lastQualificationAttempt) {
      const hoursSince = (Date.now() - teacher.lastQualificationAttempt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < RETRY_HOURS && teacher.status === 'rejected') {
        return NextResponse.json({ error: `Please wait ${Math.ceil(RETRY_HOURS - hoursSince)} hours before retrying` }, { status: 400 });
      }
    }

    const start = Date.now();
    let questions: { question: string; options: string[]; correctAnswer: number }[];
    try {
      questions = await generateQualificationExam(subject, board, classLevel);
    } catch (err) {
      await logAIUsage({
        operationType: 'generate_qualification_exam',
        userId: decoded.userId,
        userRole: 'teacher',
        inputMetadata: { subject, board, classLevel },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'generate_qualification_exam',
      userId: decoded.userId,
      userRole: 'teacher',
      inputMetadata: { subject, board, classLevel },
      outputMetadata: { questionCount: questions.length },
      durationMs: Date.now() - start,
      success: true,
    });
    await saveAIGeneratedContent({
      type: 'qualification_exam',
      board,
      classLevel,
      subject,
      content: { questions },
      requestedBy: decoded.userId as any,
      requesterRole: 'teacher',
    });
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Exam generation error:', error);
    return NextResponse.json({ error: 'Failed to generate exam' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const { answers, subject, board, classLevel } = (await request.json()) as any;
    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Answers required' }, { status: 400 });
    }

    const start = Date.now();
    let questions: { question: string; options: string[]; correctAnswer: number }[];
    try {
      questions = await generateQualificationExam(subject || 'Math', board || 'CBSE', classLevel || '10');
    } catch (err) {
      await logAIUsage({
        operationType: 'generate_qualification_exam',
        userId: decoded.userId,
        userRole: 'teacher',
        inputMetadata: { subject: subject || 'Math', board: board || 'CBSE', classLevel: classLevel || '10' },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'generate_qualification_exam',
      userId: decoded.userId,
      userRole: 'teacher',
      inputMetadata: { subject: subject || 'Math', board: board || 'CBSE', classLevel: classLevel || '10' },
      outputMetadata: { questionCount: questions.length },
      durationMs: Date.now() - start,
      success: true,
    });
    let correct = 0;
    answers.forEach((ans: number, i: number) => {
      if (questions[i] && ans === questions[i].correctAnswer) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= QUALIFICATION_THRESHOLD;

    await QualificationExam.create({
      teacherId: teacher._id,
      subject,
      board,
      classLevel,
      questions,
      answers,
      score,
      passed,
    });

    await Teacher.findByIdAndUpdate(teacher._id, {
      qualificationExamAttempts: teacher.qualificationExamAttempts + 1,
      lastQualificationAttempt: new Date(),
      status: passed ? 'qualified' : 'rejected',
    });


    return NextResponse.json({ passed, score, message: passed ? 'Congratulations! You qualified.' : 'Sorry, you did not qualify. Try again after 24 hours.' });
  } catch (error) {
    console.error('Exam submission error:', error);
    return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 });
  }
}
