import mongoose, { Schema, Document, Model } from 'mongoose';

export type PurchaseConsentType = 'platform_terms' | 'refund_policy' | 'course_ownership_rules';

export interface IPurchaseConsentLog extends Document {
  parentId: mongoose.Types.ObjectId;
  pendingEnrollmentId?: mongoose.Types.ObjectId;
  enrollmentId?: mongoose.Types.ObjectId;
  consentType: PurchaseConsentType;
  version: string;
  grantedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

const PurchaseConsentLogSchema = new Schema<IPurchaseConsentLog>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    pendingEnrollmentId: { type: Schema.Types.ObjectId, ref: 'PendingEnrollment', index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', index: true },
    consentType: {
      type: String,
      enum: ['platform_terms', 'refund_policy', 'course_ownership_rules'],
      required: true,
      index: true,
    },
    version: { type: String, required: true },
    grantedAt: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

PurchaseConsentLogSchema.index({ parentId: 1, pendingEnrollmentId: 1, consentType: 1 });
PurchaseConsentLogSchema.index({ grantedAt: -1 });

export const PurchaseConsentLog: Model<IPurchaseConsentLog> =
  mongoose.models.PurchaseConsentLog ||
  mongoose.model<IPurchaseConsentLog>('PurchaseConsentLog', PurchaseConsentLogSchema);
