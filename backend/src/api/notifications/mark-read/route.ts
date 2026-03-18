import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Notification } from '@/lib/models/Notification';
import { getAuthFromRequest } from '@/lib/auth';
import { cacheInvalidate, CacheKeys } from '@/lib/cache';

/** POST /api/notifications/mark-read - Mark notification(s) as read */
export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || !['student', 'parent', 'teacher', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.userId;

    const body = (await request.json().catch(() => ({}))) as any;
    const { notificationIds, markAll } = body;

    await connectDB();

    if (markAll) {
      await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
      await cacheInvalidate(CacheKeys.unreadCount(userId));
      return NextResponse.json({ success: true, message: 'All marked as read' });
    }

    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, userId },
        { $set: { read: true } }
      );
      await cacheInvalidate(CacheKeys.unreadCount(userId));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'notificationIds or markAll required' }, { status: 400 });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
