import mongoose, { Schema, Document, Model } from 'mongoose';

export type StaffRole = 'admin' | 'sales' | 'marketing' | 'hr' | 'finance';

export interface IAdminStaff extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  photo?: string;
  email: string;
  phone?: string;
  staffRole: StaffRole;
  position?: string;
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminStaffSchema = new Schema<IAdminStaff>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    photo: { type: String },
    email: { type: String, required: true },
    phone: { type: String },
    staffRole: { type: String, enum: ['admin', 'sales', 'marketing', 'hr', 'finance'], required: true },
    position: { type: String },
    department: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AdminStaffSchema.index({ email: 1 });
AdminStaffSchema.index({ staffRole: 1 });
AdminStaffSchema.index({ isActive: 1 });

export const AdminStaff: Model<IAdminStaff> =
  mongoose.models.AdminStaff || mongoose.model<IAdminStaff>('AdminStaff', AdminStaffSchema);
