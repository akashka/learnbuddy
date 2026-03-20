/**
 * Notification service - creates notifications for users.
 * Notifications target User._id (userId). Use Teacher.userId, Parent.userId, Student.userId.
 */
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Notification, type NotificationType } from '@/lib/models/Notification';
import { cacheInvalidate, CacheKeys } from '@/lib/cache.js';

export interface CreateNotificationParams {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
  entityType?: 'enrollment' | 'class' | 'exam' | 'reschedule' | 'payment' | 'ai_review' | 'dispute';
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await connectDB();
    await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      ctaLabel: params.ctaLabel,
      ctaUrl: params.ctaUrl,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    });
    await cacheInvalidate(CacheKeys.unreadCount(params.userId.toString()));
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

/** Create notifications for multiple users */
export async function createNotificationsForUsers(
  userIds: mongoose.Types.ObjectId[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<void> {
  const seen = new Set<string>();
  for (const uid of userIds) {
    const key = uid.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    await createNotification({ ...params, userId: uid });
  }
}
