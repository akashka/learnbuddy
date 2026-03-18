import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { Parent } from '@/lib/models/Parent';
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
    const parentId = searchParams.get('parentId');
    const board = searchParams.get('board');
    const classLevel = searchParams.get('class');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    if (parentId) query.parentId = parentId;
    if (board) query.board = board;
    if (classLevel) query.classLevel = classLevel;

    let students = await Student.find(query)
      .populate('userId', 'email isActive')
      .populate('parentId', 'name phone')
      .lean();

    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(searchLower) ||
          (s.studentId || '').toLowerCase().includes(searchLower) ||
          ((s.parentId as { name?: string })?.name || '').toLowerCase().includes(searchLower) ||
          ((s.userId as { email?: string })?.email || '').toLowerCase().includes(searchLower)
      );
    }

    students.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sort];
      const bVal = (b as unknown as Record<string, unknown>)[sort];
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return order === 'asc' ? cmp : -cmp;
    });

    const total = students.length;
    const start = (page - 1) * limit;
    const paginated = students.slice(start, start + limit);

    return NextResponse.json({
      students: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Students list error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
