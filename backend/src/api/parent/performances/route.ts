import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { StudentExam } from '@/lib/models/StudentExam';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const performances = await StudentExam.find({ studentId: { $in: parent.children } })
      .populate('studentId', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = performances.map((p) => ({
      _id: p._id,
      student: (p.studentId as { name?: string }) || null,
      subject: p.subject,
      type: (p as { examType?: string }).examType,
      score: p.score,
      totalMarks: p.totalMarks,
      date: (p as { attemptedAt?: Date; createdAt?: Date }).attemptedAt || (p as { attemptedAt?: Date; createdAt?: Date }).createdAt,
    }));

    return NextResponse.json({ performances: formatted });
  } catch (error) {
    console.error('Parent performances error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
