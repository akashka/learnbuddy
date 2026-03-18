import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Master } from '@/lib/models/Master';
import { BoardClassSubject } from '@/lib/models/BoardClassSubject';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv } from '@/lib/csvExport';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // boards | classes | subjects | mappings | all

    await connectDB();

    const rows: string[][] = [];

    if (type === 'all' || type === 'boards') {
      const boards = await Master.find({ type: 'board' }).sort({ displayOrder: 1, value: 1 }).lean();
      rows.push(['[Boards]', 'value', 'isActive']);
      boards.forEach((b) => {
        rows.push(['', (b as { value?: string }).value ?? '', (b as { isActive?: boolean }).isActive ? 'Yes' : 'No']);
      });
      rows.push([]);
    }

    if (type === 'all' || type === 'classes') {
      const classes = await Master.find({ type: 'class' }).sort({ displayOrder: 1, value: 1 }).lean();
      rows.push(['[Classes]', 'value', 'isActive']);
      classes.forEach((c) => {
        rows.push(['', (c as { value?: string }).value ?? '', (c as { isActive?: boolean }).isActive ? 'Yes' : 'No']);
      });
      rows.push([]);
    }

    if (type === 'all' || type === 'subjects') {
      const subjects = await Master.find({ type: 'subject' }).sort({ displayOrder: 1, value: 1 }).lean();
      rows.push(['[Subjects]', 'value', 'isActive']);
      subjects.forEach((s) => {
        rows.push(['', (s as { value?: string }).value ?? '', (s as { isActive?: boolean }).isActive ? 'Yes' : 'No']);
      });
      rows.push([]);
    }

    if (type === 'all' || type === 'mappings') {
      const mappings = await BoardClassSubject.find().lean();
      rows.push(['[Mappings]', 'board', 'class', 'subjects']);
      mappings.forEach((m) => {
        const board = (m as { board?: string }).board ?? '';
        const classLevel = (m as { classLevel?: string }).classLevel ?? '';
        const subjects = (m as { subjects?: string[] }).subjects ?? [];
        rows.push(['', board, classLevel, subjects.join('; ')]);
      });
    }

    const csv = toCsv(rows);

    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="masters-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Masters export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
