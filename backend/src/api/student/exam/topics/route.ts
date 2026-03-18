import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Topic } from '@/lib/models/Topic';
import { getAuthFromRequest } from '@/lib/auth';

const FALLBACK_TOPICS: Record<string, string[]> = {
  Mathematics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Number System', 'Fractions', 'Equations', 'Mensuration', 'Probability'],
  Science: ['Physics - Motion', 'Physics - Force', 'Chemistry - Atoms', 'Chemistry - Reactions', 'Biology - Cells', 'Biology - Human Body', 'Light', 'Sound', 'Electricity', 'Magnetism'],
  English: ['Grammar', 'Comprehension', 'Essay Writing', 'Vocabulary', 'Literature', 'Poetry', 'Prose', 'Letter Writing'],
  Physics: ['Motion', 'Force', 'Work and Energy', 'Light', 'Sound', 'Electricity', 'Magnetism', 'Heat', 'Waves'],
  Chemistry: ['Atoms', 'Molecules', 'Chemical Reactions', 'Acids and Bases', 'Periodic Table', 'Organic Chemistry', 'States of Matter'],
  Biology: ['Cells', 'Human Body', 'Plant Kingdom', 'Animal Kingdom', 'Genetics', 'Ecology', 'Health and Disease'],
  'Social Studies': ['History', 'Geography', 'Civics', 'Economics', 'Indian Freedom Struggle', 'World History'],
};

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const board = searchParams.get('board');
    const classLevel = searchParams.get('class');
    const subject = searchParams.get('subject');

    if (!board || !classLevel || !subject) {
      return NextResponse.json({ error: 'board, class, and subject required' }, { status: 400 });
    }

    await connectDB();

    const topics = await Topic.find({
      board,
      classLevel,
      subject,
      isActive: true,
    })
      .sort({ displayOrder: 1, topic: 1 })
      .lean()
      .then((t) => t.map((x) => x.topic));

    const result = topics.length > 0 ? topics : (FALLBACK_TOPICS[subject] || ['Key Concepts', 'Fundamentals', 'Applications', 'Practice']);
    return NextResponse.json({ topics: result });
  } catch (error) {
    console.error('Topics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}
