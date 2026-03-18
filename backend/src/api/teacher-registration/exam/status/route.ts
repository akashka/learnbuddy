import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherRegistration } from '@/lib/models/TeacherRegistration';
import { verifyTeacherRegistrationSession } from '@/lib/teacher-registration-session';

const RETRY_HOURS = 24;
const MAX_ATTEMPTS = 3;

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
      return NextResponse.json({ eligible: true });
    }

    if (reg.examAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json({
        eligible: false,
        reason: 'max_attempts_exceeded',
        examAttempts: reg.examAttempts,
      });
    }

    const lastAttempt = reg.lastExamAttemptAt;
    if (lastAttempt && reg.status === 'rejected') {
      const retryAfterAt = new Date(lastAttempt.getTime() + RETRY_HOURS * 60 * 60 * 1000);
      const now = Date.now();
      if (now < retryAfterAt.getTime()) {
        return NextResponse.json({
          eligible: false,
          reason: 'retry_wait',
          retryAfterAt: retryAfterAt.toISOString(),
          examAttempts: reg.examAttempts,
        });
      }
    }

    return NextResponse.json({ eligible: true });
  } catch (error) {
    console.error('Exam status error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
