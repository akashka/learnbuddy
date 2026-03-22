import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherChange } from '@/lib/models/TeacherChange';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - List teacher changes for admin (with parent, student, old/new teacher details) */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const skip = (page - 1) * limit;
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const [changes, total] = await Promise.all([
      TeacherChange.find({})
        .sort(sortObj as Record<string, 1 | -1>)
        .skip(skip)
        .limit(limit)
        .lean(),
      TeacherChange.countDocuments({}),
    ]);

    const parentIds = [...new Set(changes.map((c) => (c as { parentId?: unknown }).parentId?.toString()).filter(Boolean))];
    const studentIds = [...new Set(changes.map((c) => (c as { studentId?: unknown }).studentId?.toString()).filter(Boolean))];
    const oldTeacherIds = [...new Set(changes.map((c) => (c as { oldTeacherId?: unknown }).oldTeacherId?.toString()).filter(Boolean))];
    const newTeacherIds = [...new Set(changes.map((c) => (c as { newTeacherId?: unknown }).newTeacherId?.toString()).filter(Boolean))];

    const [parents, students, teachers] = await Promise.all([
      Parent.find({ _id: { $in: parentIds } }).populate('userId', 'email').lean(),
      Student.find({ _id: { $in: studentIds } }).select('name studentId').lean(),
      Teacher.find({ _id: { $in: [...oldTeacherIds, ...newTeacherIds] } }).select('name phone').lean(),
    ]);

    const parentMap = new Map(
      parents.map((p) => {
        const pid = (p as { _id: unknown })._id?.toString();
        const user = (p as { userId?: { email?: string } }).userId;
        return [
          pid,
          { name: (p as { name?: string }).name, phone: (p as { phone?: string }).phone, email: user?.email },
        ];
      })
    );
    const studentMap = new Map(students.map((s) => [(s as { _id: unknown })._id?.toString(), { name: (s as { name?: string }).name, studentId: (s as { studentId?: string }).studentId }]));
    const teacherMap = new Map(teachers.map((t) => [(t as { _id: unknown })._id?.toString(), { name: (t as { name?: string }).name, phone: (t as { phone?: string }).phone }]));

    const items = changes.map((c) => {
      const ch = c as {
        _id: unknown;
        enrollmentId: unknown;
        parentId: unknown;
        studentId: unknown;
        oldTeacherId: unknown;
        newTeacherId: unknown;
        reason: string;
        feeDifference?: number;
        oldFeePerMonth?: number;
        newFeePerMonth?: number;
        daysWithOldTeacher?: number;
        daysWithNewTeacher?: number;
        adminRemarks?: string;
        createdAt: Date;
      };
      const pid = ch.parentId?.toString();
      const sid = ch.studentId?.toString();
      const otid = ch.oldTeacherId?.toString();
      const ntid = ch.newTeacherId?.toString();
      return {
        _id: ch._id,
        enrollmentId: ch.enrollmentId,
        parentId: pid,
        studentId: sid,
        oldTeacherId: otid,
        newTeacherId: ntid,
        parent: parentMap.get(pid ?? '') ?? { name: '-', phone: '-', email: '-' },
        student: studentMap.get(sid ?? '') ?? { name: '-', studentId: '-' },
        oldTeacher: teacherMap.get(otid ?? '') ?? { name: '-', phone: '-' },
        newTeacher: teacherMap.get(ntid ?? '') ?? { name: '-', phone: '-' },
        reason: ch.reason,
        feeDifference: ch.feeDifference,
        oldFeePerMonth: ch.oldFeePerMonth,
        newFeePerMonth: ch.newFeePerMonth,
        daysWithOldTeacher: ch.daysWithOldTeacher,
        daysWithNewTeacher: ch.daysWithNewTeacher,
        adminRemarks: ch.adminRemarks,
        createdAt: ch.createdAt,
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin teacher changes error:', error);
    return NextResponse.json({ error: 'Failed to list teacher changes' }, { status: 500 });
  }
}
