import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParentWishlist extends Document {
  parentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ParentWishlistSchema = new Schema<IParentWishlist>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  },
  { timestamps: true }
);

ParentWishlistSchema.index({ parentId: 1, teacherId: 1 }, { unique: true });

export const ParentWishlist: Model<IParentWishlist> =
  mongoose.models.ParentWishlist || mongoose.model<IParentWishlist>('ParentWishlist', ParentWishlistSchema);
