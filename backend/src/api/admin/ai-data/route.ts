import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AIGeneratedContent } from '@/lib/models/AIGeneratedContent';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const board = searchParams.get('board');
    const classLevel = searchParams.get('class');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (type) {
      query.type = type === 'study_material' ? 'resource' : type;
    }
    if (board) query.board = board;
    if (classLevel) query.classLevel = classLevel;
    if (subject) query.subject = subject;
    if (topic) {
      query.$or = [
        { topic: { $regex: topic, $options: 'i' } },
        { topics: new RegExp(topic, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      AIGeneratedContent.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AIGeneratedContent.countDocuments(query),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin AI data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
