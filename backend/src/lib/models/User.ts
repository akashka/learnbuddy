import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export interface IUser extends Document {
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt?: Date;
  deactivationReason?: string;
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, sparse: true, index: true },
    role: { type: String, enum: ['student', 'parent', 'teacher', 'admin'], required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    emailVerifiedAt: Date,
    deactivationReason: String,
    deactivatedAt: Date,
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
