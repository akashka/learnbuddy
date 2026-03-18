import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { EmailVerificationToken } from '@/lib/models/EmailVerificationToken';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        (process.env.FRONTEND_URL || 'http://localhost:5173') + '/verify-email?error=missing_token'
      );
    }

    await connectDB();
    const record = await EmailVerificationToken.findOne({ token });
    if (!record || record.expiresAt < new Date()) {
      return NextResponse.redirect(
        (process.env.FRONTEND_URL || 'http://localhost:5173') + '/verify-email?error=invalid_or_expired'
      );
    }

    await User.findByIdAndUpdate(record.userId, { $set: { emailVerifiedAt: new Date() } });
    await EmailVerificationToken.deleteOne({ _id: record._id });

    return NextResponse.redirect(
      (process.env.FRONTEND_URL || 'http://localhost:5173') + '/verify-email?success=true'
    );
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.redirect(
      (process.env.FRONTEND_URL || 'http://localhost:5173') + '/verify-email?error=failed'
    );
  }
}
