import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { EmailVerificationToken } from '@/lib/models/EmailVerificationToken';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'parent' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.emailVerifiedAt) {
      return NextResponse.json({ success: true, message: 'Email already verified' });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await EmailVerificationToken.deleteMany({ userId: user._id });
    await EmailVerificationToken.create({ userId: user._id, token, expiresAt });

    const apiUrl = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    const verifyLink = `${apiUrl}/api/auth/verify-email?token=${token}`;

    // TODO: Integrate email service (SendGrid, SES, etc.) - until then log link
    console.log(`[Email Verification] Link for ${user.email}: ${verifyLink}`);

    return NextResponse.json({
      success: true,
      message: 'Verification link sent to your email',
      devLink: process.env.NODE_ENV === 'development' ? verifyLink : undefined,
    });
  } catch (error) {
    console.error('Send email verification error:', error);
    return NextResponse.json({ error: 'Failed to send verification link' }, { status: 500 });
  }
}
