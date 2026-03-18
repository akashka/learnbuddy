import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { OTP } from '@/lib/models/OTP';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { phone, otp, type } = (await request.json()) as any;

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 });
    }

    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const normalizedOtp = String(otp || '').trim().replace(/\D/g, '');
    const otpRecord = await OTP.findOne({ phone: normalizedPhone });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }
    if (otpRecord.otp !== normalizedOtp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ error: 'OTP expired' }, { status: 401 });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const response = NextResponse.json({ success: true, message: 'Phone verified' });

    if (type === 'teacher') {
      const token = jwt.sign(
        { phone: normalizedPhone, purpose: 'teacher_registration' },
        JWT_SECRET,
        { expiresIn: '30m' }
      );
      response.cookies.set('teacher_reg_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 60,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Registration verify OTP error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
