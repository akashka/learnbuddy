import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Notification } from '@/lib/models/Notification';
import { getAuthFromRequest } from '@/lib/auth';
import { cacheGetOrSet, CacheKeys, CacheTTL } from '@/lib/cache';

/** GET /api/notifications/unread-count */
export async function GET(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || !['student', 'parent', 'teacher', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.userId;
    const count = await cacheGetOrSet(CacheKeys.unreadCount(userId), CacheTTL.unreadCount, async () => {
      await connectDB();
      return Notification.countDocuments({ userId, read: false });
    });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    return NextResponse.json({ count: 0 });
  }
}
