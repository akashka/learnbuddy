import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherRegistration } from '@/lib/models/TeacherRegistration';

const RETRY_HOURS = 24;
const MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { phone } = await request.json();

    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 });
    }

    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const reg = await TeacherRegistration.findOne({ phone: normalizedPhone }).lean();

    if (!reg) {
      return NextResponse.json({ exists: false, step: 1 });
    }

    if (reg.teacherId) {
      return NextResponse.json({ exists: true, fullyRegistered: true, qualified: true, redirect: '/login' });
    }

    if (reg.status === 'max_attempts_exceeded') {
      return NextResponse.json({ exists: true, maxAttempts: true });
    }

    const hoursSinceAttempt = reg.lastExamAttemptAt
      ? (Date.now() - reg.lastExamAttemptAt.getTime()) / (1000 * 60 * 60)
      : 999;
    const canRetry = reg.examAttempts < MAX_ATTEMPTS && hoursSinceAttempt >= RETRY_HOURS;
    const retryAfterHours = reg.lastExamAttemptAt
      ? Math.max(0, RETRY_HOURS - hoursSinceAttempt)
      : 0;

    return NextResponse.json({
      exists: true,
      step: reg.currentStep,
      data: {
        step1: reg.step1Data ?? null,
        step2: reg.step2Data ?? null,
        step4: reg.step4Data ?? null,
        step5: reg.step5Data ?? null,
      },
      examAttempts: reg.examAttempts,
      lastAttemptAt: reg.lastExamAttemptAt,
      canRetry,
      retryAfterHours: Math.ceil(retryAfterHours),
    });
  } catch (error) {
    console.error('Check phone error:', error);
    return NextResponse.json({ error: 'Failed to check' }, { status: 500 });
  }
}
