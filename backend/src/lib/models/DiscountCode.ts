import mongoose, { Schema, Document, Model } from 'mongoose';

export type DiscountType = 'percent' | 'fixed';

export interface IDiscountCode extends Document {
  code: string;
  type: DiscountType;
  value: number; // percent (0-100) or fixed amount in rupees
  minAmount?: number; // minimum cart total to apply (optional)
  maxUses?: number; // total redemptions allowed (optional, null = unlimited)
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  /** Max discount amount in ₹ (for percent type - caps the discount). Optional. */
  maxDiscountAmount?: number;
  /** Applicable boards - empty = all boards */
  applicableBoards: string[];
  /** Applicable classes - empty = all classes */
  applicableClasses: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountCodeSchema = new Schema<IDiscountCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minAmount: { type: Number, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    maxUses: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    applicableBoards: { type: [String], default: [] },
    applicableClasses: { type: [String], default: [] },
    description: String,
  },
  { timestamps: true }
);

DiscountCodeSchema.index({ code: 1 });
DiscountCodeSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

export const DiscountCode: Model<IDiscountCode> =
  mongoose.models.DiscountCode || mongoose.model<IDiscountCode>('DiscountCode', DiscountCodeSchema);
