import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher, User, Enrollment } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const board = searchParams.get('board');
    const classLevel = searchParams.get('class');
    const subject = searchParams.get('subject');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (board) query.board = board;
    if (classLevel) query.classes = classLevel;
    if (subject) query.subjects = subject;

    let teachers = await Teacher.find(query)
      .populate('userId', 'email isActive')
      .lean();

    if (search) {
      const searchLower = search.toLowerCase();
      teachers = teachers.filter(
        (t) =>
          (t.name || '').toLowerCase().includes(searchLower) ||
          (t.phone || '').includes(search) ||
          ((t.userId as { email?: string })?.email || '').toLowerCase().includes(searchLower)
      );
    }

    const teacherIds = teachers.map((t) => (t as { _id: unknown })._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { teacherId: { $in: teacherIds } } },
      { $group: { _id: '$teacherId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(enrollmentCounts.map((e) => [String(e._id), e.count]));

    const teachersWithCounts = teachers.map((t) => {
      const tid = String((t as { _id: unknown })._id);
      const batches = (t as { batches?: unknown[] }).batches || [];
      return {
        ...t,
        batchCount: batches.length,
        totalStudents: countMap[tid] || 0,
        batchNames: batches.map((b: unknown) => (b as { name?: string }).name).filter(Boolean),
        bgvVerified: (t as { bgvVerified?: boolean }).bgvVerified ?? false,
      };
    });

    teachersWithCounts.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sort];
      const bVal = (b as unknown as Record<string, unknown>)[sort];
      let cmp: number;
      if (sort === 'batchCount' || sort === 'totalStudents') {
        cmp = (Number(aVal) || 0) - (Number(bVal) || 0);
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      }
      return order === 'asc' ? cmp : -cmp;
    });

    const total = teachersWithCounts.length;
    const start = (page - 1) * limit;
    const paginated = teachersWithCounts.slice(start, start + limit);

    return NextResponse.json({
      teachers: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Teachers list error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
