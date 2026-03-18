import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Master } from '@/lib/models/Master';
import { BoardClassSubject } from '@/lib/models/BoardClassSubject';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const masterQuery = includeInactive ? {} : { isActive: true };
    const masters = await Master.find(masterQuery).sort({ displayOrder: 1, value: 1 }).lean();

    const mappingQuery = includeInactive ? {} : { isActive: true };
    const mappings = await BoardClassSubject.find(mappingQuery).lean();

    const boards = masters.filter((m) => m.type === 'board');
    const classes = masters.filter((m) => m.type === 'class');
    const subjects = masters.filter((m) => m.type === 'subject');

    return NextResponse.json({
      boards,
      classes,
      subjects,
      mappings,
    });
  } catch (error) {
    console.error('Admin masters fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
