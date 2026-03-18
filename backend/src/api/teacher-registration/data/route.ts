import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherRegistration } from '@/lib/models/TeacherRegistration';
import { verifyTeacherRegistrationSession } from '@/lib/teacher-registration-session';

/**
 * GET /api/teacher-registration/data?phone=XXXXXXXXXX
 * Fetches saved registration data for the given phone.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 });
    }

    if (!verifyTeacherRegistrationSession(request, phone)) {
      return NextResponse.json({ error: 'Session expired. Please verify your number again.' }, { status: 401 });
    }

    await connectDB();
    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const reg = await TeacherRegistration.findOne({ phone: normalizedPhone }).lean();

    if (!reg) {
      return NextResponse.json({
        exists: false,
        step: 1,
        data: { step1: null, step2: null, step4: null, step5: null },
      });
    }

    if (reg.teacherId) {
      return NextResponse.json({
        exists: true,
        fullyRegistered: true,
        qualified: true,
        step: reg.currentStep,
        data: {
          step1: reg.step1Data ?? null,
          step2: reg.step2Data ?? null,
          step4: reg.step4Data ?? null,
          step5: reg.step5Data ?? null,
        },
      });
    }

    return NextResponse.json({
      exists: true,
      step: reg.currentStep,
      data: {
        step1: reg.step1Data ?? null,
        step2: reg.step2Data ?? null,
        step4: reg.step4Data ?? null,
        step5: reg.step5Data ?? null,
      },
    });
  } catch (error) {
    console.error('Fetch registration data error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
