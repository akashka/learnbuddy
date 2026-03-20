import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const student = await Student.findOne({ userId: decoded.userId }).lean();

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      name: student.name,
      studentId: student.studentId,
      classLevel: student.classLevel,
      board: student.board,
      schoolName: student.schoolName,
      photoUrl: student.photoUrl,
    });
  } catch (error) {
    console.error('Student profile error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
