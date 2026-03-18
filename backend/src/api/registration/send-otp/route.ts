import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { OTP } from '@/lib/models/OTP';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { phone, type } = await request.json();

    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 });
    }

    if (type !== 'parent' && type !== 'teacher') {
      return NextResponse.json({ error: 'Registration type required (parent or teacher)' }, { status: 400 });
    }

    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.deleteMany({ phone: normalizedPhone });
    await OTP.create({ phone: normalizedPhone, otp, expiresAt });

    // TODO: Integrate SMS gateway - until then log OTP in console
    console.log(`[OTP] Registration OTP for ${normalizedPhone} (${type}): ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      devOtp: otp,
    });
  } catch (error) {
    console.error('Registration send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
