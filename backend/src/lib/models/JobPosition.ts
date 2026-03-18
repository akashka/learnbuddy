import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobPosition extends Document {
  title: string;
  team: string;
  type: string;
  location: string;
  description: string;
  jdUrl: string;
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const JobPositionSchema = new Schema<IJobPosition>(
  {
    title: { type: String, required: true },
    team: { type: String, required: true },
    type: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, default: '' },
    jdUrl: { type: String, default: '' },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

export const JobPosition: Model<IJobPosition> =
  mongoose.models.JobPosition || mongoose.model<IJobPosition>('JobPosition', JobPositionSchema);
