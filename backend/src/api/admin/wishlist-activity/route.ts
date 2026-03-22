import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { WishlistActivity } from '@/lib/models/WishlistActivity';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - List wishlist additions and removals for admin follow-up */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const action = searchParams.get('action');
    const parentId = searchParams.get('parentId');
    const teacherId = searchParams.get('teacherId');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (parentId) query.parentId = parentId;
    if (teacherId) query.teacherId = teacherId;
    if (from || to) {
      query.createdAt = {};
      if (from) (query.createdAt as Record<string, Date>).$gte = new Date(from);
      if (to) (query.createdAt as Record<string, Date>).$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const [activities, total] = await Promise.all([
      WishlistActivity.find(query)
        .sort(sortObj as Record<string, 1 | -1>)
        .skip(skip)
        .limit(limit)
        .lean(),
      WishlistActivity.countDocuments(query),
    ]);

    const parentIds = [...new Set(activities.map((a) => (a as { parentId: unknown }).parentId?.toString()).filter(Boolean))];
    const teacherIds = [...new Set(activities.map((a) => (a as { teacherId: unknown }).teacherId?.toString()).filter(Boolean))];

    const [parents, teachers] = await Promise.all([
      parentIds.length > 0 ? Parent.find({ _id: { $in: parentIds } }).populate('userId', 'email').lean() : [],
      teacherIds.length > 0 ? Teacher.find({ _id: { $in: teacherIds } }).select('name phone').lean() : [],
    ]);

    type ParentInfo = { name: string; phone: string; email: string };
    type TeacherInfo = { name: string; phone: string };

    const parentMap = new Map<string, ParentInfo>();
    for (const p of parents) {
      const pid = (p as { _id: unknown })._id?.toString();
      const populatedUser = (p as { userId?: { email?: string } }).userId;
      if (pid) {
        parentMap.set(pid, {
          name: (p as { name?: string }).name ?? '-',
          phone: (p as { phone?: string }).phone ?? '-',
          email: populatedUser?.email ?? '-',
        });
      }
    }
    const teacherMap = new Map<string, TeacherInfo>();
    for (const t of teachers) {
      const tid = (t as { _id: unknown })._id?.toString();
      if (tid) {
        teacherMap.set(tid, {
          name: (t as { name?: string }).name ?? '-',
          phone: (t as { phone?: string }).phone ?? '-',
        });
      }
    }

    const items = activities.map((a) => {
      const act = a as { _id: unknown; parentId: unknown; teacherId: unknown; action: string; createdAt: Date };
      const pid = act.parentId?.toString();
      const tid = act.teacherId?.toString();
      const parentInfo: ParentInfo = parentMap.get(pid ?? '') ?? { name: '-', phone: '-', email: '-' };
      const teacherInfo: TeacherInfo = teacherMap.get(tid ?? '') ?? { name: '-', phone: '-' };
      return {
        _id: act._id,
        parentId: pid,
        teacherId: tid,
        action: act.action,
        createdAt: act.createdAt,
        parentName: parentInfo.name,
        parentPhone: parentInfo.phone,
        parentEmail: parentInfo.email,
        teacherName: teacherInfo.name,
        teacherPhone: teacherInfo.phone,
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin wishlist activity error:', error);
    return NextResponse.json({ error: 'Failed to list wishlist activity' }, { status: 500 });
  }
}
