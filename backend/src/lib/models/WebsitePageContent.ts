import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebsitePageContent extends Document {
  pageType: string;
  sections: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const WebsitePageContentSchema = new Schema<IWebsitePageContent>(
  {
    pageType: { type: String, required: true, unique: true },
    sections: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const WebsitePageContent: Model<IWebsitePageContent> =
  mongoose.models.WebsitePageContent ||
  mongoose.model<IWebsitePageContent>('WebsitePageContent', WebsitePageContentSchema);
