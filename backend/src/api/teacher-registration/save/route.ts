import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherRegistration } from '@/lib/models/TeacherRegistration';
import { User } from '@/lib/models/User';
import { Teacher } from '@/lib/models/Teacher';
import { hashPassword } from '@/lib/auth';
import { verifyTeacherRegistrationSession } from '@/lib/teacher-registration-session';
import { verifyRecaptcha } from '@/lib/recaptcha';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as any;
    const { phone, step, data, recaptchaToken } = body;

    if (!phone || !step) {
      return NextResponse.json({ error: 'Phone and step required' }, { status: 400 });
    }

    // reCAPTCHA is only required on the first step (initial registration)
    if (step === 1) {
      const recaptcha = await verifyRecaptcha(recaptchaToken, request);
      if (!recaptcha.success) {
        return NextResponse.json({ error: recaptcha.error || 'reCAPTCHA verification failed' }, { status: 400 });
      }
    }

    if (!verifyTeacherRegistrationSession(request, phone)) {
      return NextResponse.json({ error: 'Session expired. Please verify your number again.' }, { status: 401 });
    }

    await connectDB();
    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);

    let reg = await TeacherRegistration.findOne({ phone: normalizedPhone });

    if (!reg && step > 1) {
      return NextResponse.json({ error: 'Complete step 1 first' }, { status: 400 });
    }

    if (step === 1 && data) {
      const { email, name } = data;
      if (email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== reg?.userId?.toString()) {
          return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }
      }
    }

    if (!reg) {
      let userId;
      if (step === 1 && data?.email) {
        const hashedPassword = await hashPassword(randomUUID() + Date.now());
        const user = await User.create({
          email: data.email,
          password: hashedPassword,
          phone: normalizedPhone,
          role: 'teacher',
        });
        userId = user._id;
      }
      const step1Data = step === 1 ? { ...data } : undefined;
      reg = await TeacherRegistration.create({
        phone: normalizedPhone,
        currentStep: 1,
        step1Data,
        userId,
      });
    } else {
      const update: Record<string, unknown> = {
        lastSavedAt: new Date(),
        currentStep: Math.max(reg.currentStep, step),
      };
      if (step === 1 && data) update.step1Data = { ...reg.step1Data, ...data };
      if (step === 2 && data) update.step2Data = data;
      if (step === 4 && data) update.step4Data = { ...reg.step4Data, ...data };
      if (step === 5 && data) update.step5Data = data;

      if (step === 1 && data?.email && !reg.userId) {
        const hashedPassword = await hashPassword(randomUUID() + Date.now());
        const user = await User.create({
          email: data.email,
          password: hashedPassword,
          phone: normalizedPhone,
          role: 'teacher',
        });
        update.userId = user._id;
        update.step1Data = { ...reg.step1Data, ...data };
      }

      await TeacherRegistration.findByIdAndUpdate(reg._id, update);
      reg = await TeacherRegistration.findById(reg._id);
    }

    return NextResponse.json({
      success: true,
      step: reg?.currentStep,
      registrationId: reg?._id,
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
