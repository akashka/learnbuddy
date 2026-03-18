import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsPage extends Document {
  slug: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CmsPageSchema = new Schema<ICmsPage>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
  },
  { timestamps: true }
);

export const CmsPage: Model<ICmsPage> =
  mongoose.models.CmsPage || mongoose.model<ICmsPage>('CmsPage', CmsPageSchema);
