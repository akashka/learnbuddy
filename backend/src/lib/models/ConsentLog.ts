import mongoose, { Schema, Document, Model } from 'mongoose';

export type ConsentType = 'child_data_collection' | 'ai_monitoring';

export interface IConsentLog extends Document {
  parentId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  consentType: ConsentType;
  version: string;
  grantedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

const ConsentLogSchema = new Schema<IConsentLog>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    consentType: { type: String, enum: ['child_data_collection', 'ai_monitoring'], required: true },
    version: { type: String, required: true },
    grantedAt: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

ConsentLogSchema.index({ parentId: 1, studentId: 1, consentType: 1 });

export const ConsentLog: Model<IConsentLog> =
  mongoose.models.ConsentLog || mongoose.model<IConsentLog>('ConsentLog', ConsentLogSchema);
