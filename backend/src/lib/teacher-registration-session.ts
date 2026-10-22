import jwt from 'jsonwebtoken';
import { NextRequest } from '@/lib/next-compat';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/** Sent by the browser app. A cookie alone is not delivered from the Vercel site to the Render API. */
export const TEACHER_REG_HEADER = 'x-teacher-reg-session';

export function signTeacherRegistrationSession(phone: string): string {
  return jwt.sign(
    { phone, purpose: 'teacher_registration' },
    JWT_SECRET,
    { expiresIn: '30m' }
  );
}

export function teacherRegCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax';
  maxAge: number;
  path: string;
} {
  const production = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    maxAge: 30 * 60,
    path: '/',
  };
}

export function verifyTeacherRegistrationSession(
  request: NextRequest,
  phone: string,
  explicitToken?: string
): boolean {
  const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
  const token =
    explicitToken ||
    request.headers.get(TEACHER_REG_HEADER) ||
    request.cookies?.get('teacher_reg_session');
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { phone?: string; purpose?: string };
    return decoded.phone === normalizedPhone && decoded.purpose === 'teacher_registration';
  } catch {
    return false;
  }
}
