import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRole } from './models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; role: UserRole } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: UserRole };
    return decoded;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/** Header used by adaptNextRoute to pass pre-verified auth from Express middleware */
export const AUTH_PAYLOAD_HEADER = 'X-Auth-Payload';

/**
 * Returns the request ID (X-Request-ID) for correlation/tracing. Use in route handlers when logging.
 */
export function getRequestIdFromRequest(request: Request): string | null {
  return request.headers.get('X-Request-ID');
}

/**
 * Returns the decoded token payload from a request that was authenticated by authMiddleware.
 * Use this in route handlers instead of verifyToken - the middleware has already validated the token.
 * Returns null if the request was not authenticated via middleware.
 */
export function getAuthFromRequest(request: Request): { userId: string; role: UserRole } | null {
  const payload = request.headers.get(AUTH_PAYLOAD_HEADER);
  if (!payload) return null;
  try {
    return JSON.parse(payload) as { userId: string; role: UserRole };
  } catch {
    return null;
  }
}
