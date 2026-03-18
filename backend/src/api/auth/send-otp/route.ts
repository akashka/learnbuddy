import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { OTP } from '@/lib/models/OTP';
import { User } from '@/lib/models/User';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { phone } = await request.json();

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    const user = await User.findOne({ phone: normalizedPhone, role: { $in: ['parent', 'teacher'] } });
    if (!user) {
      return NextResponse.json({ error: 'Phone number not registered' }, { status: 404 });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.deleteMany({ phone: normalizedPhone });
    await OTP.create({ phone: normalizedPhone, otp, expiresAt });

    // TODO: Integrate SMS gateway (Twilio, MSG91, etc.) - until then log OTP in console
    console.log(`[OTP] Login OTP for ${normalizedPhone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      devOtp: otp, // Until SMS integrated: client logs this to console for testing
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
