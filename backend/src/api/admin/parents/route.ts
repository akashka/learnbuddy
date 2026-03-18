import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { User } from '@/lib/models/User';
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
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let parents = await Parent.find({})
      .populate('userId', 'email isActive')
      .lean();

    if (search) {
      const searchLower = search.toLowerCase();
      parents = parents.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(searchLower) ||
          (p.phone || '').includes(search) ||
          ((p.userId as { email?: string })?.email || '').toLowerCase().includes(searchLower)
      );
    }

    const parentsWithCounts = parents.map((p) => {
      const children = (p as { children?: unknown[] }).children || [];
      return {
        ...p,
        childrenCount: Array.isArray(children) ? children.length : 0,
      };
    });

    parentsWithCounts.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sort];
      const bVal = (b as unknown as Record<string, unknown>)[sort];
      let cmp: number;
      if (sort === 'childrenCount') {
        cmp = (Number(aVal) || 0) - (Number(bVal) || 0);
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      }
      return order === 'asc' ? cmp : -cmp;
    });

    const total = parentsWithCounts.length;
    const start = (page - 1) * limit;
    const paginated = parentsWithCounts.slice(start, start + limit);

    return NextResponse.json({
      parents: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Parents list error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
