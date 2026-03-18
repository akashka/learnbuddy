/**
 * Request ID / Correlation ID middleware for tracing across services.
 * - Reads X-Request-ID from incoming request or generates a UUID
 * - Attaches to req.requestId for use in handlers
 * - Sets X-Request-ID on response for client correlation
 * - Logs request/response in structured JSON for debugging
 */
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

function logStructured(obj: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...obj, timestamp: new Date().toISOString() }));
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logStructured({
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
    });
  });

  next();
}
