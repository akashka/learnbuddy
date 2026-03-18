import mongoose, { Schema, Document, Model } from 'mongoose';

export type MasterType = 'board' | 'class' | 'subject';

export interface IMaster extends Document {
  type: MasterType;
  value: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MasterSchema = new Schema<IMaster>(
  {
    type: { type: String, enum: ['board', 'class', 'subject'], required: true },
    value: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Master: Model<IMaster> = mongoose.models.Master || mongoose.model<IMaster>('Master', MasterSchema);
