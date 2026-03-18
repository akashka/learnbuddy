import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Master } from '@/lib/models/Master';
import { BoardClassSubject } from '@/lib/models/BoardClassSubject';
import { cacheGetOrSet, CacheKeys, CacheTTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const board = searchParams.get('board') || '';
    const classLevel = searchParams.get('class') || '';

    const result = await cacheGetOrSet(
      CacheKeys.boardClassSubjects(board, classLevel),
      CacheTTL.boardClassSubjects,
      async () => {
        await connectDB();

        const query: Record<string, string | boolean> = { isActive: true };
        if (board) query.board = board;
        if (classLevel) query.classLevel = classLevel;

        const mappings = await BoardClassSubject.find(query).lean();

        const masterBoards = await Master.find({ type: 'board', isActive: true })
          .sort({ displayOrder: 1, value: 1 })
          .lean();
        const masterClasses = await Master.find({ type: 'class', isActive: true })
          .sort({ displayOrder: 1, value: 1 })
          .lean();

        const boards =
          masterBoards.length > 0
            ? masterBoards.map((m) => m.value)
            : [...new Set(mappings.map((m) => m.board))].sort();
        const classes =
          masterClasses.length > 0
            ? masterClasses.map((m) => m.value)
            : [...new Set(mappings.map((m) => m.classLevel))].sort(
                (a, b) => parseInt(a, 10) - parseInt(b, 10)
              );

        if (board && classLevel) {
          const match = mappings.find((m) => m.board === board && m.classLevel === classLevel);
          return { boards, classes, subjects: match?.subjects || [] };
        }

        return { boards, classes, mappings };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Board class subjects error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
