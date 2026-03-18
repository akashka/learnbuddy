import mongoose, { Schema, Document, Model } from 'mongoose';

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';
export type PaymentDuration = '3months' | '6months' | '12months';

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  batchId: string;
  subject: string;
  board: string;
  classLevel: string;
  slots: { day: string; startTime: string; endTime: string }[];
  feePerMonth: number;
  duration: PaymentDuration;
  discount: number; // 0, 5, or 10
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentId?: string;
  status: EnrollmentStatus;
  startDate: Date;
  endDate: Date;
  /** Discount code used at purchase */
  discountCode?: string;
  discountCodeId?: mongoose.Types.ObjectId;
  discountCodeAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    batchId: String,
    subject: String,
    board: String,
    classLevel: String,
    slots: [{ day: String, startTime: String, endTime: String }],
    feePerMonth: Number,
    duration: { type: String, enum: ['3months', '6months', '12months'] },
    discount: { type: Number, default: 0 },
    totalAmount: Number,
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentId: String,
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    startDate: Date,
    endDate: Date,
    discountCode: String,
    discountCodeId: { type: Schema.Types.ObjectId, ref: 'DiscountCode' },
    discountCodeAmount: Number,
  },
  { timestamps: true }
);

EnrollmentSchema.index({ teacherId: 1, status: 1 });
EnrollmentSchema.index({ studentId: 1, status: 1 });
EnrollmentSchema.index({ discountCodeId: 1 });

export const Enrollment: Model<IEnrollment> = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
