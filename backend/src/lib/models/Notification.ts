import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'course_purchased'
  | 'reschedule_request'
  | 'reschedule_confirmed'
  | 'reschedule_rejected'
  | 'class_cancelled'
  | 'exam_completed'
  | 'ai_content_generated'
  | 'class_reminder_15min'
  | 'batch_start_reminder'
  | 'payment_reminder'
  | 'ai_review_requested'
  | 'ai_review_resolved'
  | 'dispute_updated'
  | 'review_reminder'
  | 'classroom_warning';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  /** CTA button label, e.g. "View Class", "See Results" */
  ctaLabel?: string;
  /** URL to navigate on CTA click */
  ctaUrl?: string;
  /** Entity type for grouping/filtering */
  entityType?: 'enrollment' | 'class' | 'exam' | 'reschedule' | 'payment' | 'ai_review' | 'dispute';
  entityId?: string;
  /** Extra data for display */
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: [
      'course_purchased', 'reschedule_request', 'reschedule_confirmed', 'reschedule_rejected',
      'class_cancelled', 'exam_completed', 'ai_content_generated', 'class_reminder_15min',
      'batch_start_reminder', 'payment_reminder', 'ai_review_requested', 'ai_review_resolved',
      'dispute_updated', 'review_reminder', 'classroom_warning'
    ], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    ctaLabel: String,
    ctaUrl: String,
    entityType: String,
    entityId: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
