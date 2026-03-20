import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { Enrollment } from '@/lib/models/Enrollment';
import { StudentExam } from '@/lib/models/StudentExam';
import { ClassSession } from '@/lib/models/ClassSession';
import { AIGeneratedContent } from '@/lib/models/AIGeneratedContent';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enrollments = await Enrollment.find({ teacherId: teacher._id, status: 'active' })
      .populate({
        path: 'studentId',
        select: 'name studentId classLevel board schoolName userId parentId',
        populate: { path: 'parentId', select: 'name phone email' },
      })
      .lean();

    const studentIds = enrollments.map((e) => (e.studentId as { _id?: unknown })?._id ?? e.studentId).filter(Boolean);
    const studentUserIds = enrollments
      .map((e) => {
        const s = e.studentId as { userId?: unknown };
        return s?.userId;
      })
      .filter(Boolean);

    const [exams, classes, smCounts] = await Promise.all([
      StudentExam.find({ studentId: { $in: studentIds }, status: 'completed' })
        .select('studentId subject score totalMarks attemptedAt')
        .sort({ attemptedAt: -1 })
        .lean(),
      ClassSession.find({
        teacherId: teacher._id,
        status: 'completed',
        $or: [{ studentId: { $in: studentIds } }, { studentIds: { $in: studentIds } }],
      })
        .select('studentId studentIds subject scheduledAt')
        .lean(),
      AIGeneratedContent.aggregate([
        { $match: { type: 'resource', requestedBy: { $in: studentUserIds } } },
        { $group: { _id: '$requestedBy', count: { $sum: 1 } } },
      ]),
    ]);

    const examsByStudent = new Map<string, { subject: string; score: number; totalMarks: number; attemptedAt: Date }[]>();
    for (const ex of exams) {
      const sid = String((ex.studentId as { _id?: unknown })?._id ?? ex.studentId);
      if (!examsByStudent.has(sid)) examsByStudent.set(sid, []);
      examsByStudent.get(sid)!.push({
        subject: ex.subject || '',
        score: ex.score ?? 0,
        totalMarks: ex.totalMarks ?? 0,
        attemptedAt: ex.attemptedAt ?? new Date(),
      });
    }

    const classesByStudent = new Map<string, number>();
    for (const c of classes) {
      const ids = c.studentIds?.length ? c.studentIds : c.studentId ? [c.studentId] : [];
      for (const id of ids) {
        const sid = String((id as { _id?: unknown })?._id ?? id);
        classesByStudent.set(sid, (classesByStudent.get(sid) || 0) + 1);
      }
    }

    const studyMaterialsByUser = new Map<string, number>();
    for (const row of smCounts) {
      studyMaterialsByUser.set(String(row._id), row.count);
    }

    const studentUserIdMap = new Map<string, string>();
    for (const e of enrollments) {
      const s = e.studentId as { _id?: unknown; userId?: unknown };
      if (s?._id && s?.userId) studentUserIdMap.set(String(s._id), String(s.userId));
    }

    const students = enrollments.map((e) => {
      const s = e.studentId as {
        _id?: unknown;
        userId?: unknown;
        parentId?: { name?: string; phone?: string; email?: string };
        name?: string;
        studentId?: string;
        classLevel?: string;
        board?: string;
        schoolName?: string;
      };
      const sid = s?._id ? String(s._id) : '';
      const uid = s?.userId ? String(s.userId) : studentUserIdMap.get(sid) || '';
      const studentExams = examsByStudent.get(sid) || [];
      const classesCount = classesByStudent.get(sid) || 0;
      const studyMaterialsCount = studyMaterialsByUser.get(uid) || 0;

      return {
        enrollmentId: (e as { _id?: unknown })._id,
        student: s
          ? {
              _id: s._id,
              name: s.name,
              studentId: s.studentId,
              classLevel: s.classLevel,
              board: s.board,
              schoolName: s.schoolName,
            }
          : null,
        parent: s?.parentId
          ? {
              name: (s.parentId as { name?: string }).name,
              phone: (s.parentId as { phone?: string }).phone,
              email: (s.parentId as { email?: string }).email,
            }
          : null,
        course: {
          subject: e.subject,
          batchId: e.batchId,
          board: e.board,
          classLevel: e.classLevel,
          feePerMonth: e.feePerMonth,
          startDate: e.startDate,
          endDate: e.endDate,
          duration: e.duration,
        },
        stats: {
          examsCount: studentExams.length,
          exams: studentExams.slice(0, 5),
          classesCompleted: classesCount,
          studyMaterialsRead: studyMaterialsCount,
        },
      };
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Teacher students error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
