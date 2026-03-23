import mongoose, { Schema, Document, Model } from 'mongoose';

export type RegistrationStep = 1 | 2 | 3 | 4 | 5;
export type DocumentVerificationStatus = 'verified' | 'not_verified' | 'partially_verified';

export interface IStep1Data {
  name: string;
  email: string;
  phone: string;
  password?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  location?: string;
  locationLat?: number;
  locationLng?: number;
}

export interface ITeachingCombination {
  board: string;
  classLevel: string;
  subject: string;
}

export interface IExamQuestion {
  question: string;
  type: 'mcq' | 'short';
  options?: string[];
  correctAnswer?: number | string;
}

export interface IExamAttempt {
  questions: IExamQuestion[];
  answers: (number | string)[];
  score?: number;
  passed?: boolean;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  warnings: number;
  closedDueToCheating?: boolean;
  profilePhotoUrl?: string;
}

export interface IDocumentUpload {
  type: string;
  url: string;
  verificationStatus: DocumentVerificationStatus;
}

export interface IBatchConfig {
  name: string;
  board: string;
  classLevel: string;
  subject: string;
  minStudents: number;
  maxStudents: number;
  slots: { day: string; startTime: string; endTime: string }[];
  feePerMonth: number;
  isActive: boolean;
  /** Batch starting date: must be tomorrow to 30 days from today */
  startDate?: string;
}

export interface ITeacherRegistration extends Document {
  phone: string;
  currentStep: RegistrationStep;
  step1Data?: IStep1Data;
  step2Data?: { combinations: ITeachingCombination[] };
  step3Data?: { examAttempts: IExamAttempt[] };
  step4Data?: {
    documents: IDocumentUpload[];
    bankDetails?: { accountNumber?: string; ifsc?: string; bankName?: string };
    personalDetails?: Record<string, unknown>;
  };
  step5Data?: { batches: IBatchConfig[] };
  examAttempts: number;
  lastExamAttemptAt?: Date;
  status: 'in_progress' | 'qualified' | 'rejected' | 'max_attempts_exceeded';
  userId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  profilePhotoUrl?: string;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherRegistrationSchema = new Schema<ITeacherRegistration>(
  {
    phone: { type: String, required: true, unique: true },
    currentStep: { type: Number, default: 1 },
    step1Data: Schema.Types.Mixed,
    step2Data: Schema.Types.Mixed,
    step3Data: Schema.Types.Mixed,
    step4Data: Schema.Types.Mixed,
    step5Data: Schema.Types.Mixed,
    examAttempts: { type: Number, default: 0 },
    lastExamAttemptAt: Date,
    status: { type: String, enum: ['in_progress', 'qualified', 'rejected', 'max_attempts_exceeded'], default: 'in_progress' },
    userId: Schema.Types.ObjectId,
    teacherId: Schema.Types.ObjectId,
    profilePhotoUrl: String,
    lastSavedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const TeacherRegistration: Model<ITeacherRegistration> =
  mongoose.models.TeacherRegistration || mongoose.model<ITeacherRegistration>('TeacherRegistration', TeacherRegistrationSchema);
