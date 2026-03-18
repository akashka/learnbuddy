import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Topic } from '@/lib/models/Topic';
import { getDefaultTopicsForSeeding } from '@/lib/seed-data';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const items = getDefaultTopicsForSeeding();
    let inserted = 0;
    for (const item of items) {
      const exists = await Topic.findOne({
        board: item.board,
        classLevel: item.classLevel,
        subject: item.subject,
        topic: item.topic,
      });
      if (!exists) {
        await Topic.create({ ...item, isActive: true });
        inserted++;
      }
    }

    return NextResponse.json({
      message: 'Topics seeded successfully',
      total: items.length,
      inserted,
    });
  } catch (error) {
    console.error('Seed topics error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
