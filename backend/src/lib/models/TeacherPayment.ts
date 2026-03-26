import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentBreakdownItem {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  batchId: string;
  subject: string;
  classesCount: number;
  feePerMonth: number;
  amount: number; // earned from this student for the period
}

export interface ITeacherPayment extends Document {
  teacherId: mongoose.Types.ObjectId;
  amount: number; // net amount paid (after deductions)
  description?: string;
  periodStart: Date;
  periodEnd: Date;
  status: 'pending' | 'paid' | 'failed';
  paidAt?: Date;
  referenceId?: string;
  /** Extended fields for detailed receipts */
  grossAmount?: number;
  commissionAmount?: number;
  commissionPercent?: number;
  tdsAmount?: number;
  tdsPercent?: number;
  breakdown?: IPaymentBreakdownItem[];
  earningTransactionIds?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PaymentBreakdownItemSchema = new Schema<IPaymentBreakdownItem>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    batchId: String,
    subject: String,
    classesCount: Number,
    feePerMonth: Number,
    amount: Number,
  },
  { _id: false }
);

const TeacherPaymentSchema = new Schema<ITeacherPayment>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    amount: { type: Number, required: true },
    description: String,
    periodStart: Date,
    periodEnd: Date,
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paidAt: Date,
    referenceId: String,
    grossAmount: Number,
    commissionAmount: Number,
    commissionPercent: Number,
    tdsAmount: Number,
    tdsPercent: Number,
    breakdown: [PaymentBreakdownItemSchema],
    earningTransactionIds: [{ type: Schema.Types.ObjectId, ref: 'TeacherEarningTransaction' }],
  },
  { timestamps: true }
);

TeacherPaymentSchema.index({ teacherId: 1, periodStart: -1 });

export const TeacherPayment: Model<ITeacherPayment> =
  mongoose.models.TeacherPayment || mongoose.model<ITeacherPayment>('TeacherPayment', TeacherPaymentSchema);
