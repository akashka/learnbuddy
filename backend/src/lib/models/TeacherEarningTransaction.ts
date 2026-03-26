import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType = 'credit' | 'deduction' | 'payment' | 'carry_over';

export interface ITeacherEarningTransaction extends Document {
  teacherId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  description: string;
  /**
   * Reference links could be:
   * - ClassSession (for deduction/credit related to a specific class)
   * - TeacherPayment (for successful payments)
   * - Nothing (for manual carry_over or manual deductions)
   */
  referenceId?: mongoose.Types.ObjectId;
  referenceModel?: 'ClassSession' | 'TeacherPayment' | 'Enrollment';
  /** Month/Year string identifier to easily aggregate earnings, e.g., "03-2026" */
  periodStr?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherEarningTransactionSchema = new Schema<ITeacherEarningTransaction>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    type: { type: String, enum: ['credit', 'deduction', 'payment', 'carry_over'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    referenceModel: { type: String, enum: ['ClassSession', 'TeacherPayment', 'Enrollment'] },
    periodStr: String,
  },
  { timestamps: true }
);

TeacherEarningTransactionSchema.index({ teacherId: 1, type: 1 });
TeacherEarningTransactionSchema.index({ teacherId: 1, periodStr: 1 });

export const TeacherEarningTransaction: Model<ITeacherEarningTransaction> =
  mongoose.models.TeacherEarningTransaction || mongoose.model<ITeacherEarningTransaction>('TeacherEarningTransaction', TeacherEarningTransactionSchema);
