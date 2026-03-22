import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeacherChange extends Document {
  enrollmentId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  oldTeacherId: mongoose.Types.ObjectId;
  newTeacherId: mongoose.Types.ObjectId;
  reason: string;
  /** Price difference: positive = parent pays more, negative = no refund */
  feeDifference?: number;
  oldFeePerMonth?: number;
  newFeePerMonth?: number;
  /** Days taught by old teacher before switch (for payment split) */
  daysWithOldTeacher?: number;
  /** Days with new teacher from switch date to period end (for payment split) */
  daysWithNewTeacher?: number;
  /** Admin remarks */
  adminRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherChangeSchema = new Schema<ITeacherChange>(
  {
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    oldTeacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    newTeacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    reason: { type: String, required: true },
    feeDifference: Number,
    oldFeePerMonth: Number,
    newFeePerMonth: Number,
    daysWithOldTeacher: Number,
    daysWithNewTeacher: Number,
    adminRemarks: String,
  },
  { timestamps: true }
);

TeacherChangeSchema.index({ enrollmentId: 1 });
TeacherChangeSchema.index({ parentId: 1, createdAt: -1 });
TeacherChangeSchema.index({ createdAt: -1 });

export const TeacherChange: Model<ITeacherChange> =
  mongoose.models.TeacherChange || mongoose.model<ITeacherChange>('TeacherChange', TeacherChangeSchema);
