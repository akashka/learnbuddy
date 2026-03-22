import mongoose, { Schema, Document, Model } from 'mongoose';

export type WishlistAction = 'add' | 'remove';

export interface IWishlistActivity extends Document {
  parentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  action: WishlistAction;
  createdAt: Date;
}

const WishlistActivitySchema = new Schema<IWishlistActivity>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    action: { type: String, enum: ['add', 'remove'], required: true },
  },
  { timestamps: true }
);

WishlistActivitySchema.index({ createdAt: -1 });
WishlistActivitySchema.index({ parentId: 1, createdAt: -1 });
WishlistActivitySchema.index({ teacherId: 1, createdAt: -1 });
WishlistActivitySchema.index({ action: 1, createdAt: -1 });

export const WishlistActivity: Model<IWishlistActivity> =
  mongoose.models.WishlistActivity ||
  mongoose.model<IWishlistActivity>('WishlistActivity', WishlistActivitySchema);
