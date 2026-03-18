import mongoose, { Schema, Document, Model } from 'mongoose';

export type DeleteScope = 'students' | 'full';

export interface IDeleteAccountRequest extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'parent' | 'teacher';
  scope: DeleteScope;
  studentIds?: mongoose.Types.ObjectId[];
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

const DeleteAccountRequestSchema = new Schema<IDeleteAccountRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['parent', 'teacher'], required: true },
    scope: { type: String, enum: ['students', 'full'], required: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

DeleteAccountRequestSchema.index({ userId: 1 });
DeleteAccountRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const DeleteAccountRequest: Model<IDeleteAccountRequest> =
  mongoose.models.DeleteAccountRequest ||
  mongoose.model<IDeleteAccountRequest>('DeleteAccountRequest', DeleteAccountRequestSchema);
