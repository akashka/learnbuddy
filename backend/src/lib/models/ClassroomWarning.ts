import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClassroomWarning extends Document {
  sessionId: mongoose.Types.ObjectId;
  targetRole: 'student' | 'teacher';
  level: number;
  reason: string;
  notifiedParent: boolean;
  notifiedAdmin: boolean;
  createdAt: Date;
}

const ClassroomWarningSchema = new Schema<IClassroomWarning>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ClassSession', required: true, index: true },
    targetRole: { type: String, enum: ['student', 'teacher'], required: true },
    level: { type: Number, required: true },
    reason: { type: String, required: true },
    notifiedParent: { type: Boolean, default: false },
    notifiedAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ClassroomWarning: Model<IClassroomWarning> =
  mongoose.models.ClassroomWarning || mongoose.model<IClassroomWarning>('ClassroomWarning', ClassroomWarningSchema);
