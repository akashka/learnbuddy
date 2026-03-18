import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Notification } from '@/lib/models/Notification';
import { getAuthFromRequest } from '@/lib/auth';

/** GET /api/notifications - List notifications for current user (userId from JWT = User._id) */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || !['student', 'parent', 'teacher', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.userId;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const unreadOnly = searchParams.get('unread') === 'true';

    const query: { userId: unknown; read?: boolean } = { userId };
    if (unreadOnly) query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Notifications list error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
