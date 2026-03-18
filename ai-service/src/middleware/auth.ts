/**
 * Auth middleware - API key or JWT
 */
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const API_KEY = process.env.AI_SERVICE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth when neither API key nor JWT secret is set (local dev only)
  if (!API_KEY && !JWT_SECRET) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

  // 1. Check API key (X-API-Key or Bearer with API key)
  if (API_KEY) {
    const providedKey = apiKeyHeader || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined);
    if (providedKey === API_KEY) {
      return next();
    }
  }

  // 2. Check JWT
  if (JWT_SECRET && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      jwt.verify(token, JWT_SECRET);
      return next();
    } catch {
      // Not a valid JWT, fall through to 401
    }
  }

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Valid API key or JWT required. Use X-API-Key header or Authorization: Bearer <token>',
  });
}
