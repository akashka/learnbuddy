import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher, Parent, Student, User } from '@/lib/models';
import { AdminStaff } from '@/lib/models/AdminStaff';
import { getAuthFromRequest } from '@/lib/auth';

const LIMIT_PER_TYPE = 5;

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    if (q.length < 2) {
      return NextResponse.json({ teachers: [], parents: [], students: [], staff: [] });
    }

    await connectDB();

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // Find user IDs matching email (for Teacher, Parent, Student)
    const usersByEmail = await User.find({ email: regex }).select('_id').limit(50).lean();
    const userIds = usersByEmail.map((u) => (u as { _id: unknown })._id);

    const [teachers, parents, students, staff] = await Promise.all([
      Teacher.find({
        $or: [
          { name: regex },
          { phone: regex },
          ...(userIds.length ? [{ userId: { $in: userIds } } as any] : []),
        ],
      })
        .populate('userId', 'email')
        .limit(LIMIT_PER_TYPE)
        .lean(),
      Parent.find({
        $or: [
          { name: regex },
          { phone: regex },
          ...(userIds.length ? [{ userId: { $in: userIds } } as any] : []),
        ],
      })
        .populate('userId', 'email')
        .limit(LIMIT_PER_TYPE)
        .lean(),
      Student.find({
        $or: [
          { name: regex },
          { studentId: regex },
          ...(userIds.length ? [{ userId: { $in: userIds } } as any] : []),
        ],
      })
        .populate('userId', 'email')
        .populate('parentId', 'name')
        .limit(LIMIT_PER_TYPE)
        .lean(),
      AdminStaff.find({
        $or: [{ name: regex }, { email: regex }, { phone: regex }],
      })
        .limit(LIMIT_PER_TYPE)
        .lean(),
    ]);

    return NextResponse.json({
      teachers: teachers.map((t) => ({
        _id: (t as { _id: unknown })._id,
        name: (t as { name?: string }).name,
        email: ((t as { userId?: { email?: string } }).userId as { email?: string })?.email,
        phone: (t as { phone?: string }).phone,
        type: 'teacher',
      })),
      parents: parents.map((p) => ({
        _id: (p as { _id: unknown })._id,
        name: (p as { name?: string }).name,
        email: ((p as { userId?: { email?: string } }).userId as { email?: string })?.email,
        phone: (p as { phone?: string }).phone,
        type: 'parent',
      })),
      students: students.map((s) => ({
        _id: (s as { _id: unknown })._id,
        name: (s as { name?: string }).name,
        studentId: (s as { studentId?: string }).studentId,
        email: ((s as { userId?: { email?: string } }).userId as { email?: string })?.email,
        parentName: ((s as { parentId?: { name?: string } }).parentId as { name?: string })?.name,
        type: 'student',
      })),
      staff: staff.map((s) => ({
        _id: (s as { _id: unknown })._id,
        name: (s as { name?: string }).name,
        email: (s as { email?: string }).email,
        phone: (s as { phone?: string }).phone,
        staffRole: (s as { staffRole?: string }).staffRole,
        type: 'staff',
      })),
    });
  } catch (error) {
    console.error('Admin global search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
