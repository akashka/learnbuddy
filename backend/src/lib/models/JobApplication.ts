import mongoose, { Schema, Document, Model } from 'mongoose';

export type JobApplicationStatus = 'new' | 'viewed' | 'in_process' | 'approved' | 'rejected';

export interface IJobApplication extends Document {
  positionId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
  status: JobApplicationStatus;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    positionId: { type: Schema.Types.ObjectId, ref: 'JobPosition', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    resumeUrl: { type: String, required: true },
    coverLetter: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'viewed', 'in_process', 'approved', 'rejected'],
      default: 'new',
    },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

export const JobApplication: Model<IJobApplication> =
  mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);
