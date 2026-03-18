import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherRegistration } from '@/lib/models/TeacherRegistration';
import {
  generateTeacherQualificationExam,
  evaluateTeacherExam,
  type TeacherExamQuestion,
} from '@/lib/ai';
import { saveAIGeneratedContent } from '@/lib/ai-data-store';
import { verifyTeacherRegistrationSession } from '@/lib/teacher-registration-session';
import { logAIUsage } from '@/lib/ai-audit';

const RETRY_HOURS = 24;
const MAX_ATTEMPTS = 3;
const EXAM_DURATION_MINUTES = 15;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 });
    }

    if (!verifyTeacherRegistrationSession(request, phone)) {
      return NextResponse.json({ error: 'Session expired. Please verify your number again.' }, { status: 401 });
    }

    await connectDB();
    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const reg = await TeacherRegistration.findOne({ phone: normalizedPhone });

    if (!reg || !reg.step2Data?.combinations?.length) {
      return NextResponse.json({ error: 'Complete step 2 first' }, { status: 400 });
    }

    if (reg.examAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Maximum attempts exceeded' }, { status: 400 });
    }

    const lastAttempt = reg.lastExamAttemptAt;
    if (lastAttempt) {
      const hoursSince = (Date.now() - lastAttempt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < RETRY_HOURS && reg.status === 'rejected') {
        return NextResponse.json({
          error: `Retry after ${Math.ceil(RETRY_HOURS - hoursSince)} hours`,
          retryAfterHours: Math.ceil(RETRY_HOURS - hoursSince),
        }, { status: 400 });
      }
    }

    const start = Date.now();
    let questions: { question: string; type: string; options?: string[]; correctAnswer?: number | string }[];
    try {
      questions = await generateTeacherQualificationExam(
        reg.step2Data.combinations,
        EXAM_DURATION_MINUTES
      );
    } catch (err) {
      await logAIUsage({
        operationType: 'generate_teacher_qualification_exam',
        entityId: reg._id,
        entityType: 'teacher_registration',
        inputMetadata: { combinationCount: reg.step2Data.combinations?.length ?? 0, durationMinutes: EXAM_DURATION_MINUTES },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'generate_teacher_qualification_exam',
      entityId: reg._id,
      entityType: 'teacher_registration',
      inputMetadata: { combinationCount: reg.step2Data.combinations?.length ?? 0, durationMinutes: EXAM_DURATION_MINUTES },
      outputMetadata: { questionCount: questions.length },
      durationMs: Date.now() - start,
      success: true,
    });

    const first = reg.step2Data.combinations[0];
    await saveAIGeneratedContent({
      type: 'qualification_exam',
      board: first?.board || 'CBSE',
      classLevel: first?.classLevel || '10',
      subject: first?.subject || 'Mathematics',
      content: { questions },
      metadata: { combinations: reg.step2Data.combinations, durationMinutes: EXAM_DURATION_MINUTES },
    });

    return NextResponse.json({
      questions,
      durationMinutes: EXAM_DURATION_MINUTES,
    });
  } catch (error) {
    console.error('Exam generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate exam';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, answers, questions, profilePhotoUrl, closedDueToCheating, warnings, abandoned } = body;

    if (!phone || !questions) {
      return NextResponse.json({ error: 'Phone and questions required' }, { status: 400 });
    }

    if (!verifyTeacherRegistrationSession(request, phone)) {
      return NextResponse.json({ error: 'Session expired. Please verify your number again.' }, { status: 401 });
    }

    await connectDB();
    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const reg = await TeacherRegistration.findOne({ phone: normalizedPhone });

    if (!reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const examAttempt: {
      questions: TeacherExamQuestion[];
      answers: (number | string)[];
      startedAt: Date;
      endedAt: Date;
      warnings: number;
      closedDueToCheating?: boolean;
      profilePhotoUrl?: string;
      passed?: boolean;
      score?: number;
    } = {
      questions: questions as TeacherExamQuestion[],
      answers: (answers || []) as (number | string)[],
      startedAt: new Date(),
      endedAt: new Date(),
      warnings: warnings || 0,
      closedDueToCheating: closedDueToCheating || false,
      profilePhotoUrl: profilePhotoUrl || undefined,
    };

    if (abandoned || closedDueToCheating || (warnings && warnings >= 3)) {
      examAttempt.passed = false;
      examAttempt.score = 0;
      const step3Data = reg.step3Data || { examAttempts: [] };
      const examAttempts = [...(step3Data.examAttempts || []), examAttempt];
      await TeacherRegistration.findByIdAndUpdate(reg._id, {
        $set: {
          examAttempts: reg.examAttempts + 1,
          lastExamAttemptAt: new Date(),
          status: reg.examAttempts + 1 >= MAX_ATTEMPTS ? 'max_attempts_exceeded' : 'rejected',
          step3Data: { examAttempts },
          currentStep: 3,
          profilePhotoUrl: profilePhotoUrl || reg.profilePhotoUrl,
        },
      });
      return NextResponse.json({
        passed: false,
        reason: abandoned ? 'abandoned' : closedDueToCheating ? 'cheating' : 'warnings',
        examAttempts: reg.examAttempts + 1,
        retryAfterHours: RETRY_HOURS,
      });
    }

    const start = Date.now();
    let score: number;
    let passed: boolean;
    try {
      const result = evaluateTeacherExam(examAttempt.questions, examAttempt.answers);
      score = result.score;
      passed = result.passed;
    } catch (err) {
      await logAIUsage({
        operationType: 'evaluate_teacher_exam',
        entityId: reg._id,
        entityType: 'teacher_registration',
        inputMetadata: { questionCount: examAttempt.questions?.length ?? 0 },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'evaluate_teacher_exam',
      entityId: reg._id,
      entityType: 'teacher_registration',
      inputMetadata: { questionCount: examAttempt.questions?.length ?? 0 },
      outputMetadata: { score, passed },
      durationMs: Date.now() - start,
      success: true,
    });
    examAttempt.score = score;
    examAttempt.passed = passed;

    const step3Data = reg.step3Data || { examAttempts: [] };
    const examAttempts = [...(step3Data.examAttempts || []), examAttempt];
    await TeacherRegistration.findByIdAndUpdate(reg._id, {
      $set: {
        examAttempts: reg.examAttempts + 1,
        lastExamAttemptAt: new Date(),
        status: passed ? 'qualified' : reg.examAttempts + 1 >= MAX_ATTEMPTS ? 'max_attempts_exceeded' : 'rejected',
        currentStep: passed ? 4 : 3,
        profilePhotoUrl: profilePhotoUrl || reg.profilePhotoUrl,
        step3Data: { examAttempts },
      },
    });

    return NextResponse.json({
      passed,
      score,
      nextStep: passed ? 4 : 3,
      examAttempts: reg.examAttempts + 1,
      retryAfterHours: passed ? 0 : RETRY_HOURS,
    });
  } catch (error) {
    console.error('Exam submit error:', error);
    return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 });
  }
}
