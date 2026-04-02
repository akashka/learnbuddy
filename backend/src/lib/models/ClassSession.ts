import mongoose, { Schema, Document, Model } from 'mongoose';

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface ICancelledBy {
  role: 'student' | 'parent' | 'teacher';
  profileId: mongoose.Types.ObjectId;
}

export interface IClassSession extends Document {
  /** @deprecated Use studentIds for batch sessions */
  enrollmentId?: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  /** @deprecated Use studentIds for batch sessions */
  studentId?: mongoose.Types.ObjectId;
  /** Batch sessions: 1-3 students */
  studentIds?: mongoose.Types.ObjectId[];
  /** Parents of students (1-3, view-only, cannot join) */
  parentIds?: mongoose.Types.ObjectId[];
  /** Enrollments for this batch session */
  enrollmentIds?: mongoose.Types.ObjectId[];
  batchId?: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  scheduledAt: Date;
  duration: number; // minutes
  status: SessionStatus;
  /** When cancelled due to reschedule */
  cancelledBy?: ICancelledBy;
  cancelledReason?: string;
  cancelledAt?: Date;
  /** Link to new session when rescheduled */
  rescheduledToSessionId?: mongoose.Types.ObjectId;
  aiMonitoringAlerts: { type: string; severity: 'warning' | 'critical'; message: string; timestamp: Date }[];
  /** Live transcript of class audio */
  transcript?: { text: string; timestamp: Date; role: 'student' | 'teacher' }[];
  recordingUrl?: string;
  /** Per-role warning counts for escalation */
  warningCounts?: { teacher: number; student: number };
  /** Latest board snapshot URL */
  boardSnapshotUrl?: string;
  /** Board screenshot history */
  boardHistory?: { url: string; timestamp: Date }[];
  /** Whether student is allowed to draw on board (teacher toggles) */
  studentBoardEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSessionSchema = new Schema<IClassSession>(
  {
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    parentIds: [{ type: Schema.Types.ObjectId, ref: 'Parent' }],
    enrollmentIds: [{ type: Schema.Types.ObjectId, ref: 'Enrollment' }],
    batchId: String,
    subject: String,
    board: String,
    classLevel: String,
    scheduledAt: Date,
    duration: Number,
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
    cancelledBy: {
      role: { type: String, enum: ['student', 'parent', 'teacher'] },
      profileId: Schema.Types.ObjectId,
    },
    cancelledReason: String,
    cancelledAt: Date,
    rescheduledToSessionId: { type: Schema.Types.ObjectId, ref: 'ClassSession' },
    aiMonitoringAlerts: [{
      type: String,
      severity: { type: String, enum: ['warning', 'critical'] },
      message: String,
      timestamp: { type: Date, default: Date.now },
    }],
    transcript: [{ text: String, timestamp: Date, role: { type: String, enum: ['student', 'teacher'] } }],
    recordingUrl: String,
    warningCounts: {
      teacher: { type: Number, default: 0 },
      student: { type: Number, default: 0 },
    },
    boardSnapshotUrl: String,
    boardHistory: [{ url: String, timestamp: { type: Date, default: Date.now } }],
    studentBoardEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ClassSessionSchema.index({ teacherId: 1, status: 1 });
ClassSessionSchema.index({ studentIds: 1, status: 1 });
ClassSessionSchema.index({ scheduledAt: 1 });
ClassSessionSchema.index({ enrollmentIds: 1 });

export const ClassSession: Model<IClassSession> = mongoose.models.ClassSession || mongoose.model<IClassSession>('ClassSession', ClassSessionSchema);
