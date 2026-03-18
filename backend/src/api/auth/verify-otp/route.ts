import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { OTP } from '@/lib/models/OTP';
import { User } from '@/lib/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    const otpRecord = await OTP.findOne({ phone: normalizedPhone });
    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }
    if (otpRecord.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ error: 'OTP expired' }, { status: 401 });
    }

    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'restricted', message: 'You are restricted to login. Please contact us.' }, { status: 403 });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateToken(user._id.toString(), user.role);
    return NextResponse.json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
