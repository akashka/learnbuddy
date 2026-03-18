import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherRegistration } from '@/lib/models/TeacherRegistration';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * GET /api/teacher-registration/verify-access?phone=XXXXXXXXXX
 * Validates that the phone was OTP-verified (via session cookie) and returns the allowed step.
 * Returns 401 if not verified. Returns allowedStep based on user's progress.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return NextResponse.json({ verified: false, error: 'Phone required' }, { status: 401 });
    }

    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const sessionCookie = request.cookies?.get('teacher_reg_session');

    if (!sessionCookie) {
      return NextResponse.json({ verified: false, error: 'Session expired. Please verify your number again.' }, { status: 401 });
    }

    let decoded: { phone?: string; purpose?: string };
    try {
      decoded = jwt.verify(sessionCookie, JWT_SECRET) as { phone?: string; purpose?: string };
    } catch {
      return NextResponse.json({ verified: false, error: 'Session expired. Please verify your number again.' }, { status: 401 });
    }

    if (decoded.phone !== normalizedPhone || decoded.purpose !== 'teacher_registration') {
      return NextResponse.json({ verified: false, error: 'Invalid session' }, { status: 401 });
    }

    await connectDB();
    const reg = await TeacherRegistration.findOne({ phone: normalizedPhone }).lean();

    if (reg?.teacherId) {
      return NextResponse.json({ verified: true, allowedStep: 5, fullyRegistered: true });
    }

    // allowedStep = first step user must complete (based on actual data, not currentStep)
    let allowedStep = 1;
    if (!reg?.step1Data?.name || !reg?.step1Data?.email) {
      allowedStep = 1;
    } else if (!reg?.step2Data?.combinations?.length) {
      allowedStep = 2;
    } else if (reg.status !== 'qualified') {
      allowedStep = 3; // must pass exam
    } else if (!reg?.step4Data?.documents?.length && !reg?.step4Data?.bankDetails?.accountNumber) {
      allowedStep = 4;
    } else {
      allowedStep = 5;
    }

    const response = NextResponse.json({ verified: true, allowedStep });

    const newToken = jwt.sign(
      { phone: normalizedPhone, purpose: 'teacher_registration' },
      JWT_SECRET,
      { expiresIn: '30m' }
    );
    response.cookies.set('teacher_reg_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify access error:', error);
    return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 500 });
  }
}
