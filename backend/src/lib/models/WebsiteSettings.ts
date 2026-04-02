import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebsiteSettings extends Document {
  playStoreUrl: string;
  appStoreUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  contactPhone: string;
  contactHours: string;
  contactDays: string;
  translations?: Record<string, { contactHours?: string; contactDays?: string }>;
  updatedAt: Date;
}

const WebsiteSettingsSchema = new Schema<IWebsiteSettings>(
  {
    playStoreUrl: { type: String, default: '' },
    appStoreUrl: { type: String, default: '' },
    facebookUrl: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactHours: { type: String, default: '' },
    contactDays: { type: String, default: '' },
    translations: { type: Map, of: Object, default: {} },
  },
  { timestamps: true }
);

export const WebsiteSettings: Model<IWebsiteSettings> =
  mongoose.models.WebsiteSettings ||
  mongoose.model<IWebsiteSettings>('WebsiteSettings', WebsiteSettingsSchema);
