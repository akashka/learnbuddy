import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQualificationExam extends Document {
  teacherId: mongoose.Types.ObjectId;
  subject: string;
  board: string;
  classLevel: string;
  questions: { question: string; options: string[]; correctAnswer: number }[];
  answers: number[];
  score: number;
  passed: boolean;
  attemptedAt: Date;
}

const QualificationExamSchema = new Schema<IQualificationExam>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    subject: String,
    board: String,
    classLevel: String,
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
    }],
    answers: [Number],
    score: Number,
    passed: Boolean,
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const QualificationExam: Model<IQualificationExam> = mongoose.models.QualificationExam || mongoose.model<IQualificationExam>('QualificationExam', QualificationExamSchema);
