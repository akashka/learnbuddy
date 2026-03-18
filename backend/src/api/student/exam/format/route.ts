import { NextRequest, NextResponse } from '@/lib/next-compat';
import { getExamFormat, type ExamType } from '@/lib/ai';
import { getAuthFromRequest } from '@/lib/auth';

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
    const examType = (searchParams.get('examType') || 'class_test') as ExamType;

    if (!board || !classLevel || !subject) {
      return NextResponse.json({ error: 'board, class, and subject required' }, { status: 400 });
    }

    const format = getExamFormat(examType, board, classLevel, subject);
    return NextResponse.json(format);
  } catch (error) {
    console.error('Exam format error:', error);
    return NextResponse.json({ error: 'Failed to get format' }, { status: 500 });
  }
}
