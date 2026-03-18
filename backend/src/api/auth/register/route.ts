import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { Teacher } from '@/lib/models/Teacher';
import { Parent } from '@/lib/models/Parent';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password, role, ...profileData } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password and role are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const phone = profileData.phone ? String(profileData.phone).replace(/\D/g, '').slice(-10) : undefined;
    if (phone && (role === 'parent' || role === 'teacher')) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
      }
    }
    const user = await User.create({ email, password: hashedPassword, role, ...(phone && { phone }) });

    if (role === 'teacher') {
      await Teacher.create({
        userId: user._id,
        name: profileData.name,
        phone: profileData.phone,
        board: profileData.board || [],
        classes: profileData.classes || [],
        subjects: profileData.subjects || [],
        status: 'pending',
      });
    } else if (role === 'parent') {
      await Parent.create({
        userId: user._id,
        name: profileData.name,
        phone: profileData.phone,
        location: profileData.location,
        children: [],
      });
    }

    const token = generateToken(user._id.toString(), user.role);
    return NextResponse.json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
