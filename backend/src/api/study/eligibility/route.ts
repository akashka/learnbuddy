import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Teacher } from '@/lib/models/Teacher';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'student' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const subjects: { subject: string; board: string; classLevel: string }[] = [];

    if (decoded.role === 'student') {
      const student = await Student.findOne({ userId: decoded.userId });
      if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const enrollments = await Enrollment.find({ studentId: student._id, status: 'active' }).lean();
      const seen = new Set<string>();
      enrollments.forEach((e) => {
        const key = `${e.subject}-${e.board}-${e.classLevel}`;
        if (!seen.has(key)) {
          seen.add(key);
          subjects.push({ subject: e.subject, board: e.board, classLevel: e.classLevel });
        }
      });
    } else {
      const teacher = await Teacher.findOne({ userId: decoded.userId });
      if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const boards = (teacher.board && teacher.board.length) ? teacher.board : ['CBSE'];
      const combos = boards.flatMap((b) =>
        (teacher.classes || []).flatMap((c) =>
          (teacher.subjects || []).map((s) => ({
            subject: s,
            board: b,
            classLevel: c,
          }))
        )
      );
      const seen = new Set<string>();
      combos.forEach((c) => {
        const key = `${c.subject}-${c.board}-${c.classLevel}`;
        if (!seen.has(key)) {
          seen.add(key);
          subjects.push(c);
        }
      });
    }

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Study eligibility error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
