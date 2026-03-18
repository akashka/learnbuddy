import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Master } from '@/lib/models/Master';
import { BoardClassSubject } from '@/lib/models/BoardClassSubject';
import { BOARDS, CLASSES, ALL_SUBJECTS, getBoardClassSubjectMappings } from '@/lib/seed-data';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Replace board, class, and subject masters with current seed data
    await Master.deleteMany({ type: { $in: ['board', 'class', 'subject'] } });
    const masterDocs = [
      ...BOARDS.map((v, i) => ({ type: 'board', value: v, displayOrder: i + 1 })),
      ...CLASSES.map((v, i) => ({ type: 'class', value: v, displayOrder: i + 1 })),
      ...ALL_SUBJECTS.map((v, i) => ({ type: 'subject', value: v, displayOrder: i + 1 })),
    ];
    await Master.insertMany(masterDocs);

    await BoardClassSubject.deleteMany({});
    const mappings = getBoardClassSubjectMappings();
    await BoardClassSubject.insertMany(mappings);

    return NextResponse.json({
      message: 'Masters seeded successfully',
      boards: BOARDS.length,
      classes: CLASSES.length,
      subjects: ALL_SUBJECTS.length,
      mappings: getBoardClassSubjectMappings().length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
