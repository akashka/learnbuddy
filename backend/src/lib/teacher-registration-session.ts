import jwt from 'jsonwebtoken';
import { NextRequest } from '@/lib/next-compat';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function verifyTeacherRegistrationSession(request: NextRequest, phone: string): boolean {
  const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
  const sessionCookie = request.cookies.get('teacher_reg_session')?.value;
  if (!sessionCookie) return false;
  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET) as { phone?: string; purpose?: string };
    return decoded.phone === normalizedPhone && decoded.purpose === 'teacher_registration';
  } catch {
    return false;
  }
}
