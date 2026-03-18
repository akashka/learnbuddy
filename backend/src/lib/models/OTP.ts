import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTP extends Document {
  phone: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    phone: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

OTPSchema.index({ phone: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP: Model<IOTP> = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);
