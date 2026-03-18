import mongoose, { Schema, Document, Model } from 'mongoose';

export type AIContentType = 'resource' | 'doubt_answer' | 'exam_questions' | 'qualification_exam';

export interface IAIGeneratedContent extends Document {
  type: AIContentType;
  board: string;
  classLevel: string;
  subject: string;
  topic?: string;
  topics?: string[];
  /** For doubt_answer: the student/teacher question */
  question?: string;
  /** The AI-generated content (JSON-serializable) */
  content: Record<string, unknown>;
  /** Who requested (userId from JWT) */
  requestedBy?: mongoose.Types.ObjectId;
  /** Role of requester */
  requesterRole?: 'student' | 'teacher';
  /** Extra metadata (e.g. examType for exam_questions) */
  metadata?: Record<string, unknown>;
  /** Admin/content reviewer feedback: what was wrong, for AI improvement */
  adminFeedback?: {
    whatWasWrong: string;
    flaggedAt: Date;
    flaggedBy: mongoose.Types.ObjectId;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AIGeneratedContentSchema = new Schema<IAIGeneratedContent>(
  {
    type: { type: String, enum: ['resource', 'doubt_answer', 'exam_questions', 'qualification_exam'], required: true },
    board: { type: String, required: true },
    classLevel: { type: String, required: true },
    subject: { type: String, required: true },
    topic: String,
    topics: [String],
    question: String,
    content: { type: Schema.Types.Mixed, required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    requesterRole: { type: String, enum: ['student', 'teacher'] },
    metadata: { type: Schema.Types.Mixed },
    adminFeedback: [{
      whatWasWrong: String,
      flaggedAt: { type: Date, default: Date.now },
      flaggedBy: { type: Schema.Types.ObjectId, ref: 'AdminStaff' },
    }],
  },
  { timestamps: true }
);

AIGeneratedContentSchema.index({ type: 1, board: 1, classLevel: 1, subject: 1 });
AIGeneratedContentSchema.index({ createdAt: -1 });

export const AIGeneratedContent: Model<IAIGeneratedContent> =
  mongoose.models.AIGeneratedContent ||
  mongoose.model<IAIGeneratedContent>('AIGeneratedContent', AIGeneratedContentSchema);
