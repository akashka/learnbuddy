import mongoose, { Schema, Document, Model } from 'mongoose';

export type TeacherStatus = 'pending' | 'qualified' | 'rejected' | 'suspended';

export interface ISlot {
  day: string; // Mon, Tue, Wed, etc.
  startTime: string;
  endTime: string;
}

export interface IBatch {
  name: string;
  slots: ISlot[];
  minStudents: number;
  maxStudents: number;
  feePerMonth: number;
  subject: string;
  board: string;
  classLevel: string;
  isActive?: boolean;
  /** Batch starting date: must be tomorrow to 30 days from today */
  startDate?: Date;
}

export type AIExamPerformance = 'green' | 'yellow' | 'red';

export interface ITeacher extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  photoUrl?: string;
  qualification?: string;
  /** Profession/occupation: Teacher, Engineer, Housewife, etc. */
  profession?: string;
  /** Languages the teacher can speak (e.g. English, Hindi, Marathi) */
  languages?: string[];
  /** Total teaching experience in months */
  experienceMonths?: number;
  aiExamPerformance?: AIExamPerformance;
  board: string[];
  classes: string[];
  subjects: string[];
  qualificationExamAttempts: number;
  lastQualificationAttempt?: Date;
  status: TeacherStatus;
  documents: { name: string; url: string; verified?: boolean }[];
  demoVideoUrl?: string;
  batches: IBatch[];
  bio?: string;
  bankDetails?: { accountNumber?: string; ifsc?: string; bankName?: string };
  /** Admin-set marketplace order: 1 = highest preference, 2 = second, etc. Lower = shown first when sort=relevance */
  marketplaceOrder?: number;
  /** Commission % charged from teacher (default 10). Configurable per teacher by admin. */
  commissionPercent?: number;
  /** Agreements signed by teacher: commission_model, payment_terms, conduct_rules */
  signedAgreements?: { type: string; version: string; signedAt: Date; ipAddress?: string }[];
  /** Background verification: approved by admin */
  bgvVerified?: boolean;
  bgvApprovedBy?: mongoose.Types.ObjectId;
  bgvApprovedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema = new Schema<ISlot>({
  day: String,
  startTime: String,
  endTime: String,
});

const BatchSchema = new Schema<IBatch>({
  name: String,
  slots: [SlotSchema],
  minStudents: { type: Number, default: 1 },
  maxStudents: { type: Number, min: 1, max: 3 },
  feePerMonth: Number,
  subject: String,
  board: String,
  classLevel: String,
  isActive: { type: Boolean, default: true },
  startDate: Date,
});

const TeacherSchema = new Schema<ITeacher>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    phone: String,
    photoUrl: String,
    qualification: String,
    profession: String,
    languages: [String],
    experienceMonths: Number,
    aiExamPerformance: { type: String, enum: ['green', 'yellow', 'red'] },
    board: [String],
    classes: [String],
    subjects: [String],
    qualificationExamAttempts: { type: Number, default: 0 },
    lastQualificationAttempt: Date,
    status: { type: String, enum: ['pending', 'qualified', 'rejected', 'suspended'], default: 'pending' },
    documents: [{ name: String, url: String, verified: Boolean }],
    demoVideoUrl: String,
    batches: [BatchSchema],
    bio: String,
    bankDetails: { accountNumber: String, ifsc: String, bankName: String },
    marketplaceOrder: { type: Number, default: 999 },
    commissionPercent: { type: Number, default: 10 },
    signedAgreements: [{ type: String, version: String, signedAt: Date, ipAddress: String }],
    bgvVerified: { type: Boolean, default: false },
    bgvApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    bgvApprovedAt: Date,
  },
  { timestamps: true }
);

TeacherSchema.index({ status: 1, board: 1, classes: 1, subjects: 1 });

export const Teacher: Model<ITeacher> = mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', TeacherSchema);
