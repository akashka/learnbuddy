import mongoose, { Schema, Document, Model } from 'mongoose';

export type AIExamPerformance = 'green' | 'yellow' | 'red';

export interface ITeacherReview extends Document {
  teacherId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  enrollmentId?: mongoose.Types.ObjectId;
  rating: number; // 1-5
  review: string;
  /** Sentiment score 0-1; low = potentially inappropriate */
  sentimentScore?: number;
  /** Review text with offending words masked (when sentiment low) */
  reviewDisplay?: string;
  createdAt: Date;
}

const TeacherReviewSchema = new Schema<ITeacherReview>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: String,
    sentimentScore: Number,
    reviewDisplay: String,
  },
  { timestamps: true }
);

export const TeacherReview: Model<ITeacherReview> =
  mongoose.models.TeacherReview || mongoose.model<ITeacherReview>('TeacherReview', TeacherReviewSchema);
