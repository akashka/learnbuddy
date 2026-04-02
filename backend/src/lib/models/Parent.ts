import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParent extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  location?: string;
  photoUrl?: string;
  children: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ParentSchema = new Schema<IParent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: String,
    phone: { type: String, index: true },
    location: String,
    photoUrl: String,
    children: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

export const Parent: Model<IParent> = mongoose.models.Parent || mongoose.model<IParent>('Parent', ParentSchema);
