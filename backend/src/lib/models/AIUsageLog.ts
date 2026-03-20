import mongoose, { Schema, Document, Model } from 'mongoose';

export type AIOperationType =
  | 'generate_study_material'
  | 'generate_flashcards'
  | 'answer_doubt'
  | 'generate_exam_questions'
  | 'generate_qualification_exam'
  | 'generate_teacher_qualification_exam'
  | 'evaluate_student_exam'
  | 'evaluate_teacher_exam'
  | 'analyze_classroom_frame'
  | 'analyze_exam_frame'
  | 'analyze_exam_frame_with_audio'
  | 'verify_document_photo';

export interface IAIUsageLog extends Document {
  operationType: AIOperationType;
  /** User who triggered the AI call (if authenticated) */
  userId?: mongoose.Types.ObjectId;
  /** Role of user: student, teacher, parent, admin */
  userRole?: string;
  /** Source: ai_service (external) or local_gemini */
  source: 'ai_service' | 'local_gemini';
  /** Related entity for traceability */
  entityId?: mongoose.Types.ObjectId;
  entityType?: 'exam' | 'course_material' | 'class_session' | 'teacher_registration' | 'student' | string;
  /** Sanitized input metadata (no PII, no raw images/audio) */
  inputMetadata?: Record<string, unknown>;
  /** Output summary (score, alert type, etc. - not full content) */
  outputMetadata?: Record<string, unknown>;
  /** Duration in milliseconds */
  durationMs?: number;
  success: boolean;
  /** Error message if failed */
  errorMessage?: string;
  /** Model identifier if available (e.g. gemini-1.5-flash) */
  modelId?: string;
  createdAt: Date;
}

const AIUsageLogSchema = new Schema<IAIUsageLog>(
  {
    operationType: {
      type: String,
      enum: [
        'generate_study_material',
        'generate_flashcards',
        'answer_doubt',
        'generate_exam_questions',
        'generate_qualification_exam',
        'generate_teacher_qualification_exam',
        'evaluate_student_exam',
        'evaluate_teacher_exam',
        'analyze_classroom_frame',
        'analyze_exam_frame',
        'analyze_exam_frame_with_audio',
        'verify_document_photo',
      ],
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userRole: String,
    source: { type: String, enum: ['ai_service', 'local_gemini'], required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    entityType: String,
    inputMetadata: { type: Schema.Types.Mixed },
    outputMetadata: { type: Schema.Types.Mixed },
    durationMs: Number,
    success: { type: Boolean, required: true, index: true },
    errorMessage: String,
    modelId: String,
  },
  { timestamps: true }
);

AIUsageLogSchema.index({ createdAt: -1 });
AIUsageLogSchema.index({ operationType: 1, createdAt: -1 });

export const AIUsageLog: Model<IAIUsageLog> =
  mongoose.models.AIUsageLog || mongoose.model<IAIUsageLog>('AIUsageLog', AIUsageLogSchema);
