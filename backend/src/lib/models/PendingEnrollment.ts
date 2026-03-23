import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentDuration = '3months' | '6months' | '12months';

export interface IPendingEnrollment extends Document {
  parentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  batchIndex: number;
  subject: string;
  board: string;
  classLevel: string;
  slots: { day: string; startTime: string; endTime: string }[];
  feePerMonth: number;
  duration: PaymentDuration;
  discount: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentId?: string;
  studentDetails?: {
    name: string;
    classLevel: string;
    schoolName?: string;
    photoUrl?: string;
    idProofUrl?: string;
    aiVerified?: boolean;
  };
  termsAccepted: boolean; // legacy: true when all three below are true
  platformTermsAccepted?: boolean;
  refundPolicyAccepted?: boolean;
  courseOwnershipRulesAccepted?: boolean;
  teacherChangeCount: number; // max 3
  convertedToEnrollmentId?: mongoose.Types.ObjectId;
  /** Discount code applied at checkout */
  discountCode?: string;
  discountCodeId?: mongoose.Types.ObjectId;
  discountCodeAmount?: number;
  /** Child selected at checkout (existing student) — used when mapping course after payment */
  intendedStudentId?: mongoose.Types.ObjectId;
  /** Optional profile collected at checkout for a new child (mapped after payment) */
  checkoutChildProfile?: { name: string; classLevel: string; schoolName?: string };
  /** When set, completing payment replaces this enrollment (teacher switch) */
  replacesEnrollmentId?: mongoose.Types.ObjectId;
  /** Snapshot of pro-rata math for teacher switch (audit / receipts) */
  prorataBreakdown?: Record<string, unknown>;
  /** When set, completing payment extends this enrollment (renewal / advance installment) */
  renewalOfEnrollmentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PendingEnrollmentSchema = new Schema<IPendingEnrollment>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    batchIndex: Number,
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
    studentDetails: Schema.Types.Mixed,
    termsAccepted: { type: Boolean, default: false },
    platformTermsAccepted: { type: Boolean, default: false },
    refundPolicyAccepted: { type: Boolean, default: false },
    courseOwnershipRulesAccepted: { type: Boolean, default: false },
    teacherChangeCount: { type: Number, default: 0 },
    convertedToEnrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
    discountCode: String,
    discountCodeId: { type: Schema.Types.ObjectId, ref: 'DiscountCode' },
    discountCodeAmount: Number,
    intendedStudentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    checkoutChildProfile: {
      name: String,
      classLevel: String,
      schoolName: String,
    },
    replacesEnrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
    prorataBreakdown: Schema.Types.Mixed,
    renewalOfEnrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
  },
  { timestamps: true }
);

export const PendingEnrollment: Model<IPendingEnrollment> =
  mongoose.models.PendingEnrollment || mongoose.model<IPendingEnrollment>('PendingEnrollment', PendingEnrollmentSchema);
