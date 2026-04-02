import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { Student } from '@/lib/models/Student';
import { verifyPassword, generateToken } from '@/lib/auth';
import { logAuditEvent } from '@/lib/auditLog';
import { verifyRecaptcha } from '@/lib/recaptcha';

function getClientMeta(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;
  const requestId = request.headers.get('x-request-id') || undefined;
  return { ipAddress: ip, userAgent, requestId };
}

export async function POST(request: NextRequest) {
  const meta = getClientMeta(request);
  try {
    await connectDB();
    const body = (await request.json()) as any;
    const { type, studentId, password, email, recaptchaToken } = body;

    const recaptcha = await verifyRecaptcha(recaptchaToken, request);
    if (!recaptcha.success) {
      return NextResponse.json({ error: recaptcha.error || 'reCAPTCHA verification failed' }, { status: 400 });
    }

    if (type === 'student') {
      if (!studentId || !password) {
        return NextResponse.json({ error: 'Student ID and password required' }, { status: 400 });
      }
      const student = await Student.findOne({ studentId: studentId.toUpperCase().trim() }).populate('userId');
      if (!student || !student.userId) {
        return NextResponse.json({ error: 'Invalid student ID or password' }, { status: 401 });
      }
      const user = student.userId as unknown as { _id: unknown; password: string; role: string; email: string; isActive: boolean };
      if (!user.isActive) {
        return NextResponse.json({ error: 'restricted', message: 'You are restricted to login. Please contact us.' }, { status: 403 });
      }
      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid student ID or password' }, { status: 401 });
      }
      const token = generateToken((user._id as { toString: () => string }).toString(), 'student');
      return NextResponse.json({
        token,
        user: { id: user._id, email: user.email, role: 'student' },
      });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      void logAuditEvent({
        action: 'login',
        method: 'POST',
        path: '/api/auth/login',
        statusCode: 401,
        success: false,
        details: { attemptedEmail: email },
        ...meta,
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (!user.isActive) {
      void logAuditEvent({
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorRole: user.role,
        action: 'login',
        method: 'POST',
        path: '/api/auth/login',
        statusCode: 403,
        success: false,
        details: { reason: 'account_restricted' },
        ...meta,
      });
      return NextResponse.json({ error: 'restricted', message: 'You are restricted to login. Please contact us.' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      void logAuditEvent({
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorRole: user.role,
        action: 'login',
        method: 'POST',
        path: '/api/auth/login',
        statusCode: 401,
        success: false,
        details: { reason: 'invalid_password' },
        ...meta,
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.role === 'admin') {
      void logAuditEvent({
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorRole: user.role,
        action: 'login',
        method: 'POST',
        path: '/api/auth/login',
        statusCode: 200,
        success: true,
        ...meta,
      });
    }

    const token = generateToken(user._id.toString(), user.role);
    return NextResponse.json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
