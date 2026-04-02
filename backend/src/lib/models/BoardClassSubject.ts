import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBoardClassSubject extends Document {
  board: string;
  classLevel: string;
  subjects: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BoardClassSubjectSchema = new Schema<IBoardClassSubject>(
  {
    board: { type: String, required: true },
    classLevel: { type: String, required: true },
    subjects: [String],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

BoardClassSubjectSchema.index({ board: 1, classLevel: 1 }, { unique: true });

export const BoardClassSubject: Model<IBoardClassSubject> =
  mongoose.models.BoardClassSubject || mongoose.model<IBoardClassSubject>('BoardClassSubject', BoardClassSubjectSchema);
