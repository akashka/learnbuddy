import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  /** When the action occurred (UTC) */
  createdAt: Date;
  /** User ID of the actor (admin/staff) */
  actorId?: mongoose.Types.ObjectId;
  /** Email of the actor for display (denormalized for compliance) */
  actorEmail?: string;
  /** Role of the actor */
  actorRole?: string;
  /** Action: login, logout, create, update, delete, etc. */
  action: string;
  /** Resource type: teacher, student, enrollment, topic, etc. */
  resourceType?: string;
  /** Resource ID if applicable */
  resourceId?: string;
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** HTTP status code of the response */
  statusCode?: number;
  /** Optional details (sanitized, no sensitive data) */
  details?: Record<string, unknown>;
  /** Client IP address */
  ipAddress?: string;
  /** User-Agent for client identification */
  userAgent?: string;
  /** Request ID for correlation */
  requestId?: string;
  /** Success/failure for login attempts */
  success?: boolean;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: String,
    actorRole: String,
    action: { type: String, required: true, index: true },
    resourceType: { type: String, index: true },
    resourceId: String,
    method: { type: String, required: true, index: true },
    path: { type: String, required: true, index: true },
    statusCode: Number,
    details: { type: Schema.Types.Mixed },
    ipAddress: String,
    userAgent: String,
    requestId: String,
    success: Boolean,
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
