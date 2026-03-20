import mongoose, { Schema, Document, Model } from 'mongoose';

export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'rejected';

export interface IPaymentDispute extends Document {
  raisedBy: 'parent' | 'teacher';
  userId: mongoose.Types.ObjectId;
  /** For parent: enrollmentId. For teacher: paymentId or batch reference */
  referenceType: 'enrollment' | 'payment' | 'batch' | 'other';
  referenceId?: string;
  subject: string;
  description: string;
  status: DisputeStatus;
  adminNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentDisputeSchema = new Schema<IPaymentDispute>(
  {
    raisedBy: { type: String, enum: ['parent', 'teacher'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referenceType: { type: String, enum: ['enrollment', 'payment', 'batch', 'other'], default: 'other' },
    referenceId: String,
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_review', 'resolved', 'rejected'], default: 'open' },
    adminNotes: String,
    resolvedAt: Date,
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PaymentDisputeSchema.index({ userId: 1, createdAt: -1 });
PaymentDisputeSchema.index({ status: 1 });

export const PaymentDispute: Model<IPaymentDispute> =
  mongoose.models.PaymentDispute || mongoose.model<IPaymentDispute>('PaymentDispute', PaymentDisputeSchema);
