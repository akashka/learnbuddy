/**
 * Audit middleware - logs admin mutations and auth events for compliance.
 * Attaches a 'finish' listener to log after the response is sent.
 */
import type { Request, Response, NextFunction } from 'express';
import { logAuditEvent, deriveAuditContext } from './auditLog.js';

const MUTATING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const isAdminMutation = req.path.startsWith('/api/admin/') && MUTATING_METHODS.includes(req.method);
  const isLogout = req.path === '/api/auth/logout' && req.method === 'POST';

  if (!isAdminMutation && !isLogout) {
    next();
    return;
  }

  res.on('finish', () => {
    const decoded = req.auth?.decoded;
    const { action, resourceType } = deriveAuditContext(req.method, req.path);

    const resourceIdMatch = req.path.match(/\/api\/admin\/[^/]+\/([^/]+)(?:\/|$)/);
    const resourceId = resourceIdMatch ? resourceIdMatch[1] : undefined;

    const auditAction = isLogout ? 'logout' : action;

    void logAuditEvent({
      actorId: decoded?.userId,
      actorRole: decoded?.role,
      action: auditAction,
      resourceType: isLogout ? undefined : resourceType,
      resourceId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
      success: res.statusCode >= 200 && res.statusCode < 300,
    });
  });

  next();
}
