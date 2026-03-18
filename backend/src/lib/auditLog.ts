/**
 * Audit logging for compliance and auditing.
 * Logs admin actions: login, logout, and all mutations (create, update, delete).
 * Non-blocking - audit failure does not break the main flow.
 */
import connectDB from '@/lib/db';
import { AuditLog } from '@/lib/models/AuditLog';
import { AdminStaff } from '@/lib/models/AdminStaff';
import mongoose from 'mongoose';

export interface AuditLogParams {
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  success?: boolean;
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    await connectDB();

    let actorEmail = params.actorEmail;
    if (params.actorId && !actorEmail) {
      const staff = await AdminStaff.findOne({ userId: params.actorId }).lean();
      if (staff) actorEmail = staff.email;
    }

    await AuditLog.create({
      actorId: params.actorId ? new mongoose.Types.ObjectId(params.actorId) : undefined,
      actorEmail: actorEmail ?? params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      method: params.method,
      path: params.path,
      statusCode: params.statusCode,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      success: params.success,
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

/** Derive action and resourceType from HTTP method and path */
export function deriveAuditContext(method: string, path: string): { action: string; resourceType?: string } {
  const action = method === 'POST' ? 'create' : method === 'PATCH' || method === 'PUT' ? 'update' : method === 'DELETE' ? 'delete' : 'unknown';
  const match = path.match(/^\/api\/admin\/([^/]+)/);
  const resourceType = match ? match[1].replace(/-/g, '_') : undefined;
  return { action, resourceType };
}
