import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { BoardClassSubject } from '@/lib/models/BoardClassSubject';
import { getAuthFromRequest } from '@/lib/auth';
import { cacheInvalidatePattern } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { board, classLevel, subjects } = body;

    if (!board || !classLevel || !Array.isArray(subjects)) {
      return NextResponse.json(
        { error: 'board, classLevel, and subjects (array) required' },
        { status: 400 }
      );
    }

    const mapping = await BoardClassSubject.create({
      board,
      classLevel,
      subjects: subjects || [],
      isActive: true,
    });

    await cacheInvalidatePattern('bcs:*');
    return NextResponse.json(mapping);
  } catch (error) {
    console.error('Mapping create error:', error);
    return NextResponse.json({ error: 'Failed to create mapping' }, { status: 500 });
  }
}
