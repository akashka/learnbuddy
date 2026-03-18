import { NextRequest, NextResponse } from '@/lib/next-compat';
import { getAuthFromRequest } from '@/lib/auth';

const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  Mathematics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Number System', 'Fractions', 'Equations', 'Mensuration', 'Probability'],
  Science: ['Physics - Motion', 'Physics - Force', 'Chemistry - Atoms', 'Chemistry - Reactions', 'Biology - Cells', 'Biology - Human Body', 'Light', 'Sound', 'Electricity', 'Magnetism'],
  English: ['Grammar', 'Comprehension', 'Essay Writing', 'Vocabulary', 'Literature', 'Poetry', 'Prose', 'Letter Writing'],
  Hindi: ['व्याकरण', 'निबंध', 'कविता', 'वाक्य', 'शब्द', 'पर्यायवाची', 'विलोम'],
  Physics: ['Motion', 'Force', 'Work and Energy', 'Light', 'Sound', 'Electricity', 'Magnetism', 'Heat', 'Waves'],
  Chemistry: ['Atoms', 'Molecules', 'Chemical Reactions', 'Acids and Bases', 'Periodic Table', 'Organic Chemistry', 'States of Matter'],
  Biology: ['Cells', 'Human Body', 'Plant Kingdom', 'Animal Kingdom', 'Genetics', 'Ecology', 'Health and Disease'],
  'Social Studies': ['History', 'Geography', 'Civics', 'Economics', 'Indian Freedom Struggle', 'World History'],
  'Environmental Studies (EVS)': ['Environment', 'Conservation', 'Pollution', 'Natural Resources', 'Ecosystem'],
};

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'student' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    if (!subject) {
      return NextResponse.json({ error: 'Subject required' }, { status: 400 });
    }

    const topics = TOPICS_BY_SUBJECT[subject] || [
      'Introduction',
      'Key Concepts',
      'Advanced Topics',
      'Applications',
      'Practice Problems',
      'Summary',
    ];

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Topics error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
