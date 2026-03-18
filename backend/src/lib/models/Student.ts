import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudent extends Document {
  studentId: string;
  userId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  name: string;
  dateOfBirth: Date;
  board: string;
  classLevel: string;
  schoolName?: string;
  photoUrl?: string;
  idProofUrl?: string;
  enrollments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: { type: String, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    name: String,
    dateOfBirth: { type: Date, required: true },
    board: String,
    classLevel: String,
    schoolName: String,
    photoUrl: String,
    idProofUrl: String,
    enrollments: [{ type: Schema.Types.ObjectId, ref: 'Enrollment' }],
  },
  { timestamps: true }
);

export const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
