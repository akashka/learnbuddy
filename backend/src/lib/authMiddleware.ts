/**
 * Express middleware that centralizes token verification.
 * Extracts Bearer token, verifies it, checks blacklist (logout), and attaches decoded payload to req.auth.
 * Returns 401 if token is missing, invalid, or revoked.
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth.js';
import { isBlacklisted } from './tokenBlacklist.js';

declare global {
  namespace Express {
    interface Request {
      auth?: { decoded: { userId: string; role: string } };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  } catch {
    // Fail open: if Redis errors, allow the request
  }

  req.auth = { decoded };
  next();
}
