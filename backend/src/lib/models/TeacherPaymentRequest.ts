import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface ITeacherPaymentRequest extends Document {
  teacherId: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  status: PaymentRequestStatus;
  adminNotes?: string;
  resolvedBy?: mongoose.Types.ObjectId; // Admin user ID
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherPaymentRequestSchema = new Schema<ITeacherPaymentRequest>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    adminNotes: String,
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
  },
  { timestamps: true }
);

TeacherPaymentRequestSchema.index({ teacherId: 1, status: 1 });
TeacherPaymentRequestSchema.index({ status: 1 });

export const TeacherPaymentRequest: Model<ITeacherPaymentRequest> =
  mongoose.models.TeacherPaymentRequest || mongoose.model<ITeacherPaymentRequest>('TeacherPaymentRequest', TeacherPaymentRequestSchema);
