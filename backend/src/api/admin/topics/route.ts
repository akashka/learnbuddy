import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Topic } from '@/lib/models/Topic';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const board = searchParams.get('board');
    const classLevel = searchParams.get('class');
    const subject = searchParams.get('subject');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const query: Record<string, unknown> = {};
    if (board) query.board = board;
    if (classLevel) query.classLevel = classLevel;
    if (subject) query.subject = subject;
    if (!includeInactive) query.isActive = true;

    const topics = await Topic.find(query)
      .sort({ board: 1, classLevel: 1, subject: 1, displayOrder: 1, topic: 1 })
      .lean();

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Admin topics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = (await request.json()) as any;
    const { board, classLevel, subject, topic, displayOrder } = body;

    if (!board || !classLevel || !subject || !topic) {
      return NextResponse.json({ error: 'board, classLevel, subject, and topic required' }, { status: 400 });
    }

    const existing = await Topic.findOne({ board, classLevel, subject, topic });
    if (existing) {
      return NextResponse.json({ error: 'Topic already exists for this board/class/subject' }, { status: 400 });
    }

    const created = await Topic.create({
      board,
      classLevel,
      subject,
      topic: topic.trim(),
      displayOrder: displayOrder ?? 999,
      isActive: true,
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error('Admin topics create error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
