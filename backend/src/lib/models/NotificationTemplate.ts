import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationChannel = 'sms' | 'email' | 'in_app';

export interface INotificationTemplate extends Document {
  channel: NotificationChannel;
  /** Unique code per channel, e.g. login_otp, class_reminder_15min */
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  /** SMS: plain text body. Supports {{otp}}, {{subject}}, etc. */
  body?: string;
  /** SMS: approved wordings for guidance (DND compliance) */
  approvedWordings?: string[];
  /** Email: subject line */
  subject?: string;
  /** Email: HTML body */
  bodyHtml?: string;
  /** Email: optional header HTML (logo, branding) */
  headerHtml?: string;
  /** Email: optional footer HTML */
  footerHtml?: string;
  /** Email: logo URL for header */
  logoUrl?: string;
  /** In-app: title */
  title?: string;
  /** In-app: message body */
  message?: string;
  /** In-app: CTA button label */
  ctaLabel?: string;
  /** In-app: CTA URL (can use {{entityId}} etc.) */
  ctaUrl?: string;
  /** Variable hints for admins, e.g. {{otp}}, {{studentName}}, {{subject}} */
  variableHints?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    channel: { type: String, enum: ['sms', 'email', 'in_app'], required: true, index: true },
    code: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    body: { type: String },
    approvedWordings: [{ type: String }],
    subject: { type: String },
    bodyHtml: { type: String },
    headerHtml: { type: String },
    footerHtml: { type: String },
    logoUrl: { type: String },
    title: { type: String },
    message: { type: String },
    ctaLabel: { type: String },
    ctaUrl: { type: String },
    variableHints: [{ type: String }],
  },
  { timestamps: true }
);

NotificationTemplateSchema.index({ channel: 1, code: 1 }, { unique: true });

export const NotificationTemplate: Model<INotificationTemplate> =
  mongoose.models.NotificationTemplate ||
  mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);
