import mongoose, { Schema, Document, Model } from 'mongoose';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'reported';

export interface ISecurityIncident extends Document {
  title: string;
  description: string;
  type: string; // e.g. 'data_breach', 'unauthorized_access', 'suspicious_activity'
  severity: IncidentSeverity;
  status: IncidentStatus;
  /** Whether children's data was affected (DPDP: triggers Board + parent notification) */
  childrenDataAffected: boolean;
  /** When the incident was detected */
  detectedAt: Date;
  /** Affected data types (e.g. names, emails, payment info) */
  affectedDataTypes?: string[];
  /** Approximate number of affected users (if known) */
  affectedUserCount?: number;
  /** Data Protection Board notified (DPDP requirement) */
  boardNotifiedAt?: Date;
  /** Affected users/parents notified */
  usersNotifiedAt?: Date;
  /** Actions taken */
  actionsTaken?: string[];
  reportedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SecurityIncidentSchema = new Schema<ISecurityIncident>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    status: {
      type: String,
      enum: ['open', 'investigating', 'contained', 'resolved', 'reported'],
      default: 'open',
    },
    childrenDataAffected: { type: Boolean, default: false },
    detectedAt: { type: Date, required: true },
    affectedDataTypes: [String],
    affectedUserCount: Number,
    boardNotifiedAt: Date,
    usersNotifiedAt: Date,
    actionsTaken: [String],
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

SecurityIncidentSchema.index({ status: 1 });
SecurityIncidentSchema.index({ detectedAt: -1 });
SecurityIncidentSchema.index({ childrenDataAffected: 1 });

export const SecurityIncident: Model<ISecurityIncident> =
  mongoose.models.SecurityIncident ||
  mongoose.model<ISecurityIncident>('SecurityIncident', SecurityIncidentSchema);
