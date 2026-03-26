import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExamMode = 'quiz' | 'mini' | 'full';
export type ExamType = 'quick_test' | 'class_test' | 'preparatory' | 'topic_wise' | 'mock';
export type AnswerInputType = 'typed' | 'photo' | 'audio';
export type QuestionType = 'mcq' | 'objective' | 'short';

export interface IExamQuestion {
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: number | string;
  marks: number;
  imageUrl?: string;
  requiresDrawing?: boolean;
}

export interface IStudentAnswer {
  value: number | string; // MCQ: index, typed: string
  photoUrl?: string; // if answerType was photo
  audioTranscript?: string; // if answerType was audio
}

export interface IAIFeedback {
  good: string[];
  bad: string[];
  overall: string;
  questionFeedback?: { questionIndex: number; correct: boolean; feedback: string }[];
  questionDetails?: { questionIndex: number; userAnswer: string | number; sentimentWarning?: boolean }[];
  lowSentimentWarning?: boolean;
}

export interface IStudentExam extends Document {
  studentId: mongoose.Types.ObjectId;
  subject: string;
  board: string;
  classLevel: string;
  examMode: ExamMode;
  examType: ExamType;
  topic?: string;
  topics?: string[];
  questions: IExamQuestion[];
  answers: (number | string | IStudentAnswer)[];
  answerInputType: AnswerInputType;
  score: number;
  totalMarks: number;
  timeLimit: number; // minutes
  timeTaken: number; // minutes
  attemptedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'evaluating' | 'completed' | 'terminated';
  // AI monitoring
  warnings: number;
  closedDueToCheating?: boolean;
  monitoringAlerts: { type: string; message: string; timestamp: Date; transcript?: string }[];
  /** Timeline of proctoring samples (lightweight; frame snapshot only when alert). */
  monitoringEvidence?: { timestamp: Date; alert: boolean; note?: string; frameSnapshot?: string }[];
  monitoringTranscripts: { transcript: string; timestamp: Date }[]; // Speech-to-text during exam
  recordingUrl?: string;
  // AI evaluation
  aiFeedback?: IAIFeedback;
  enrollmentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExamQuestionSchema = new Schema({
  question: String,
  type: { type: String, enum: ['mcq', 'objective', 'short'] },
  options: [String],
  correctAnswer: Schema.Types.Mixed,
  marks: { type: Number, default: 1 },
  imageUrl: String,
  requiresDrawing: { type: Boolean, default: false },
});

const StudentExamSchema = new Schema<IStudentExam>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: String,
    board: String,
    classLevel: String,
    examMode: { type: String, enum: ['quiz', 'mini', 'full'] },
    examType: { type: String, enum: ['quick_test', 'class_test', 'preparatory', 'topic_wise', 'mock'] },
    topic: String,
    topics: [String],
    questions: [ExamQuestionSchema],
    answers: [Schema.Types.Mixed],
    answerInputType: { type: String, enum: ['typed', 'photo', 'audio'], default: 'typed' },
    score: Number,
    totalMarks: Number,
    timeLimit: Number,
    timeTaken: Number,
    attemptedAt: { type: Date, default: Date.now },
    completedAt: Date,
    status: { type: String, enum: ['in_progress', 'evaluating', 'completed', 'terminated'], default: 'in_progress' },
    warnings: { type: Number, default: 0 },
    closedDueToCheating: Boolean,
    monitoringAlerts: [{ type: { type: String }, message: String, timestamp: { type: Date, default: Date.now }, transcript: String }],
    monitoringEvidence: {
      type: [
        {
          timestamp: { type: Date, default: Date.now },
          alert: { type: Boolean, default: false },
          note: String,
          frameSnapshot: String,
        },
      ],
      default: [],
    },
    monitoringTranscripts: { type: [{ transcript: String, timestamp: { type: Date, default: Date.now } }], default: [] },
    recordingUrl: String,
    aiFeedback: Schema.Types.Mixed,
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
  },
  { timestamps: true }
);

export const StudentExam: Model<IStudentExam> = mongoose.models.StudentExam || mongoose.model<IStudentExam>('StudentExam', StudentExamSchema);
