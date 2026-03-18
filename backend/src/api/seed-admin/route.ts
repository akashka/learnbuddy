import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Welcome123';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const reset = new URL(request.url).searchParams.get('reset') === '1';

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      if (reset) {
        const hashedPassword = await hashPassword(ADMIN_PASSWORD);
        await User.findByIdAndUpdate(existing._id, { $set: { password: hashedPassword } });
        return NextResponse.json({
          message: 'Admin password reset successfully',
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
      }
      return NextResponse.json({
        message: 'Admin user already exists. Use ?reset=1 to reset password.',
        email: ADMIN_EMAIL,
      });
    }

    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    await User.create({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    return NextResponse.json({
      message: 'Admin user created successfully',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
  } catch (error) {
    console.error('Seed admin error:', error);
    return NextResponse.json({ error: 'Seed admin failed' }, { status: 500 });
  }
}
