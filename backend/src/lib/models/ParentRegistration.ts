import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParentRegistrationData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  location?: string;
}

export interface IParentRegistration extends Document {
  phone: string;
  data?: IParentRegistrationData;
  isComplete: boolean;
  userId?: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParentRegistrationSchema = new Schema<IParentRegistration>(
  {
    phone: { type: String, required: true, unique: true },
    data: Schema.Types.Mixed,
    isComplete: { type: Boolean, default: false },
    userId: Schema.Types.ObjectId,
    parentId: Schema.Types.ObjectId,
    lastSavedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ParentRegistration: Model<IParentRegistration> =
  mongoose.models.ParentRegistration || mongoose.model<IParentRegistration>('ParentRegistration', ParentRegistrationSchema);
