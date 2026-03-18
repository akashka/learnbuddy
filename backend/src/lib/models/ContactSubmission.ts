import mongoose, { Schema, Document, Model } from 'mongoose';

export type ContactSubmissionType = 'concern' | 'suggestion' | 'feedback' | 'other';
export type ContactSubmissionStatus = 'open' | 'in_process' | 'closed';

export interface IContactSubmission extends Document {
  name: string;
  email: string;
  phone?: string;
  type: ContactSubmissionType;
  subject: string;
  message: string;
  status: ContactSubmissionStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSubmissionSchema = new Schema<IContactSubmission>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    type: {
      type: String,
      enum: ['concern', 'suggestion', 'feedback', 'other'],
      default: 'other',
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in_process', 'closed'],
      default: 'open',
    },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export const ContactSubmission: Model<IContactSubmission> =
  mongoose.models.ContactSubmission ||
  mongoose.model<IContactSubmission>('ContactSubmission', ContactSubmissionSchema);
