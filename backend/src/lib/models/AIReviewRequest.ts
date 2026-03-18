import mongoose, { Schema, Document, Model } from 'mongoose';

export type AIReviewEntityType = 'exam' | 'course_material';
export type AIReviewStatus = 'pending' | 'in_review' | 'resolved_correct' | 'resolved_incorrect';

export interface IAIReviewRequest extends Document {
  /** exam = StudentExam._id, course_material = AIGeneratedContent._id */
  entityType: AIReviewEntityType;
  entityId: mongoose.Types.ObjectId;
  /** User who raised the request */
  raisedBy: mongoose.Types.ObjectId;
  raisedByRole: 'student' | 'teacher' | 'parent';
  /** For parent: which child's exam/material */
  studentId?: mongoose.Types.ObjectId;
  /** User's remark explaining the issue */
  remark: string;
  status: AIReviewStatus;
  /** Admin's reply / final report */
  adminReply?: string;
  /** For exam: corrected score if admin changed it */
  correctedScore?: number;
  /** For course material: corrected content summary */
  correctedContent?: Record<string, unknown>;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIReviewRequestSchema = new Schema<IAIReviewRequest>(
  {
    entityType: { type: String, enum: ['exam', 'course_material'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    raisedByRole: { type: String, enum: ['student', 'teacher', 'parent'], required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    remark: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'resolved_correct', 'resolved_incorrect'],
      default: 'pending',
      index: true,
    },
    adminReply: String,
    correctedScore: Number,
    correctedContent: Schema.Types.Mixed,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

AIReviewRequestSchema.index({ entityType: 1, entityId: 1 });
AIReviewRequestSchema.index({ raisedBy: 1, createdAt: -1 });
AIReviewRequestSchema.index({ status: 1, createdAt: -1 });

export const AIReviewRequest: Model<IAIReviewRequest> =
  mongoose.models.AIReviewRequest ||
  mongoose.model<IAIReviewRequest>('AIReviewRequest', AIReviewRequestSchema);
